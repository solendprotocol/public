import {
  AddressLookupTableAccount,
  BlockhashWithExpiryBlockHeight,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  NATIVE_MINT,
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  getMinimumBalanceForRentExemptAccount,
  createCloseAccountInstruction,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";
import BN from "bn.js";
import BigNumber from "bignumber.js";
import { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver";
import {
  Obligation,
  OBLIGATION_SIZE,
  parseObligation,
} from "../state/obligation";
import { parseReserve } from "../state/reserve";
import {
  depositReserveLiquidityAndObligationCollateralInstruction,
  depositReserveLiquidityInstruction,
  redeemReserveCollateralInstruction,
  repayObligationLiquidityInstruction,
  withdrawObligationCollateralAndRedeemReserveLiquidity,
  refreshReserveInstruction,
  initObligationInstruction,
  borrowObligationLiquidityInstruction,
  refreshObligationInstruction,
  syncNative,
  depositObligationCollateralInstruction,
  withdrawObligationCollateralInstruction,
  forgiveDebtInstruction,
  repayMaxObligationLiquidityInstruction,
  depositMaxReserveLiquidityAndObligationCollateralInstruction,
  withdrawExact,
  liquidateObligationAndRedeemReserveCollateral,
} from "../instructions";
import { NULL_ORACLE, POSITION_LIMIT } from "./constants";
import { EnvironmentType } from "./types";
import { getProgramId, U64_MAX, WAD } from "./constants";
import { PriceServiceConnection } from "@pythnetwork/price-service-client";
import { AnchorProvider, Program } from "@coral-xyz/anchor-30";
import {
  CrossbarClient,
  loadLookupTables,
  PullFeed,
  ON_DEMAND_MAINNET_PID,
} from "@switchboard-xyz/on-demand";
import { Wallet } from "@coral-xyz/anchor";
import {
  createDepositAndMintWrapperTokensInstruction,
  createWithdrawAndBurnWrapperTokensInstruction,
} from "@solendprotocol/token2022-wrapper-sdk";
import { ReserveType } from "./utils";
import { getSizeOfTransaction } from "../transaction";

const SOL_PADDING_FOR_INTEREST = "1000000";

type ActionConfigType = {
  environment?: EnvironmentType;
  customObligationAddress?: PublicKey;
  hostAta?: PublicKey;
  customObligationSeed?: string;
  lookupTableAddress?: PublicKey;
  tipAmount?: number;
  repayReserve?: ReserveType;
  token2022Mint?: string;
  repayToken2022Mint?: string;
  debug?: boolean;
};

type SupportType =
  | "wrap"
  | "unwrap"
  | "refreshReserves"
  | "refreshObligation"
  | "createObligation"
  | "cAta"
  | "ata"
  | "wrapRepay"
  | "wsol";

const ACTION_SUPPORT_REQUIREMENTS: {
  [Property in ActionType]: Array<SupportType>;
} = {
  deposit: ["wsol", "wrap", "createObligation", "cAta"],
  borrow: ["wsol", "ata", "refreshReserves", "refreshObligation", "unwrap"],
  withdraw: [
    "wsol",
    "ata",
    "cAta",
    "refreshReserves",
    "refreshObligation",
    "unwrap",
  ],
  repay: ["wsol", "wrap"],
  mint: ["wsol", "wrap", "cAta"],
  redeem: ["wsol", "ata", "refreshReserves", "unwrap"],
  depositCollateral: ["createObligation"],
  withdrawCollateral: ["cAta", "refreshReserves", "refreshObligation"],
  forgive: ["refreshReserves", "refreshObligation"],
  liquidate: [
    "wsol",
    "ata",
    "cAta",
    "wrapRepay",
    "unwrap",
    "refreshReserves",
    "refreshObligation",
  ],
};

export const toHexString = (byteArray: number[]) => {
  return (
    "0x" +
    Array.from(byteArray, function (byte) {
      return byte.toString(16).padStart(2, "0");
    }).join("")
  );
};

export type ActionType =
  | "deposit"
  | "borrow"
  | "withdraw"
  | "repay"
  | "mint"
  | "redeem"
  | "depositCollateral"
  | "withdrawCollateral"
  | "forgive"
  | "liquidate";

type InputPoolType = {
  address: string;
  owner: string;
  name: string | null;
  authorityAddress: string;
  reserves: Array<ReserveType>;
};

export class SolendActionCore {
  programId: PublicKey;

  connection: Connection;

  reserve: ReserveType;

  pool: InputPoolType;

  publicKey: PublicKey;

  obligationAddress: PublicKey;

  obligationAccountInfo: Obligation | null;

  userTokenAccountAddress: PublicKey;

  userCollateralAccountAddress: PublicKey;

  seed: string;

  positions?: number;

  amount: BN;

  hostAta?: PublicKey;

  // TODO: potentially don't need to keep signers
  pullPriceTxns: Array<VersionedTransaction>;

  setupIxs: Array<TransactionInstruction>;

  lendingIxs: Array<TransactionInstruction>;

  cleanupIxs: Array<TransactionInstruction>;

  preTxnIxs: Array<TransactionInstruction>;

  postTxnIxs: Array<TransactionInstruction>;

  depositReserves: Array<PublicKey>;

  borrowReserves: Array<PublicKey>;

  lookupTableAccount?: AddressLookupTableAccount;

  jitoTipAmount: number;

  wallet: Wallet;

  debug: boolean;

  repayInfo?: {
    userRepayTokenAccountAddress: PublicKey;
    userRepayCollateralAccountAddress: PublicKey;
    repayToken2022Mint?: PublicKey;
    repayWrappedAta?: PublicKey;
    repayMint: PublicKey;
    reserveAddress: PublicKey;
  };

  token2022Mint?: PublicKey;

  wrappedAta?: PublicKey;

  environment: EnvironmentType;

  private constructor(
    programId: PublicKey,
    connection: Connection,
    reserve: ReserveType,
    pool: InputPoolType,
    wallet: Wallet,
    obligationAddress: PublicKey,
    obligationAccountInfo: Obligation | null,
    userTokenAccountAddress: PublicKey,
    userCollateralAccountAddress: PublicKey,
    seed: string,
    positions: number,
    amount: BN,
    depositReserves: Array<PublicKey>,
    borrowReserves: Array<PublicKey>,
    config?: {
      environment?: EnvironmentType;
      hostAta?: PublicKey;
      lookupTableAccount?: AddressLookupTableAccount;
      tipAmount?: number;
      repayInfo?: {
        userRepayTokenAccountAddress: PublicKey;
        userRepayCollateralAccountAddress: PublicKey;
        repayToken2022Mint?: PublicKey;
        repayWrappedAta?: PublicKey;
        repayMint: PublicKey;
        reserveAddress: PublicKey;
      };
      token2022Mint?: PublicKey;
      wrappedAta?: PublicKey;
      debug?: boolean;
    }
  ) {
    this.programId = programId;
    this.connection = connection;
    this.publicKey = wallet.publicKey;
    this.amount = new BN(amount);
    this.positions = positions;
    this.hostAta = config?.hostAta;
    this.obligationAccountInfo = obligationAccountInfo;
    this.pool = pool;
    this.seed = seed;
    this.reserve = reserve;
    this.obligationAddress = obligationAddress;
    this.userTokenAccountAddress = userTokenAccountAddress;
    this.userCollateralAccountAddress = userCollateralAccountAddress;
    this.pullPriceTxns = [] as Array<VersionedTransaction>;
    this.setupIxs = [];
    this.lendingIxs = [];
    this.cleanupIxs = [];
    this.preTxnIxs = [];
    this.postTxnIxs = [];
    this.depositReserves = depositReserves;
    this.borrowReserves = borrowReserves;
    this.lookupTableAccount = config?.lookupTableAccount;
    this.jitoTipAmount = config?.tipAmount ?? 9000;
    this.wallet = wallet;
    this.repayInfo = config?.repayInfo;
    this.token2022Mint = config?.token2022Mint;
    this.wrappedAta = config?.wrappedAta;
    // temporarily default to true
    this.debug = config?.debug ?? true;
    this.environment = config?.environment ?? "production";
  }

  static async initialize(
    pool: InputPoolType,
    reserve: ReserveType,
    action: ActionType,
    amount: BN,
    wallet: Wallet,
    connection: Connection,
    config: ActionConfigType
  ) {
    const seed = config.customObligationSeed ?? pool.address.slice(0, 32);
    const programId = getProgramId(config.environment ?? "production");

    const obligationAddress =
      config.customObligationAddress ??
      (await PublicKey.createWithSeed(wallet.publicKey, seed, programId));

    const obligationAccountInfo = await connection.getAccountInfo(
      obligationAddress,
      "processed"
    );

    let obligationDetails = null;
    const depositReserves: Array<PublicKey> = [];
    const borrowReserves: Array<PublicKey> = [];

    if (obligationAccountInfo) {
      obligationDetails = parseObligation(
        PublicKey.default,
        obligationAccountInfo
      )!.info;

      obligationDetails.deposits.forEach((deposit) => {
        depositReserves.push(deposit.depositReserve);
      });

      obligationDetails.borrows.forEach((borrow) => {
        borrowReserves.push(borrow.borrowReserve);
      });
    }

    // Union of addresses
    const distinctReserveCount =
      Array.from(
        new Set([
          ...borrowReserves.map((e) => e.toBase58()),
          ...(action === "borrow" ? [reserve.address] : []),
        ])
      ).length +
      Array.from(
        new Set([
          ...depositReserves.map((e) => e.toBase58()),
          ...(action === "deposit" ? [reserve.address] : []),
        ])
      ).length;

    if (distinctReserveCount > POSITION_LIMIT) {
      throw Error(
        `Obligation already has max number of positions: ${POSITION_LIMIT}`
      );
    }

    const userTokenAccountAddress = await getAssociatedTokenAddress(
      new PublicKey(reserve.mintAddress),
      wallet.publicKey,
      true
    );
    const userCollateralAccountAddress = await getAssociatedTokenAddress(
      new PublicKey(reserve.cTokenMint),
      wallet.publicKey,
      true
    );
    const lookupTableAccount = config.lookupTableAddress
      ? (await connection.getAddressLookupTable(config.lookupTableAddress))
          .value
      : undefined;

    const userRepayTokenAccountAddress = config.repayReserve
      ? await getAssociatedTokenAddress(
          new PublicKey(config.repayReserve.mintAddress),
          wallet.publicKey,
          true
        )
      : undefined;

    const userRepayCollateralAccountAddress = config.repayReserve
      ? await getAssociatedTokenAddress(
          new PublicKey(config.repayReserve.cTokenMint),
          wallet.publicKey,
          true
        )
      : undefined;

    return new SolendActionCore(
      programId,
      connection,
      reserve,
      pool,
      wallet,
      obligationAddress,
      obligationDetails,
      userTokenAccountAddress,
      userCollateralAccountAddress,
      seed,
      distinctReserveCount,
      amount,
      depositReserves,
      borrowReserves,

      {
        environment: config.environment,
        hostAta: config.hostAta,
        lookupTableAccount: lookupTableAccount ?? undefined,
        tipAmount: config.tipAmount,
        repayInfo: config.repayReserve
          ? {
              userRepayTokenAccountAddress: userRepayTokenAccountAddress!,
              userRepayCollateralAccountAddress:
                userRepayCollateralAccountAddress!,
              repayToken2022Mint: config.repayToken2022Mint
                ? new PublicKey(config.repayToken2022Mint)
                : undefined,
              repayWrappedAta: config.repayToken2022Mint
                ? getAssociatedTokenAddressSync(
                    new PublicKey(config.repayToken2022Mint),
                    wallet.publicKey,
                    true,
                    TOKEN_2022_PROGRAM_ID
                  )
                : undefined,
              repayMint: new PublicKey(config.repayReserve.mintAddress),
              reserveAddress: new PublicKey(config.repayReserve.address),
            }
          : undefined,
        token2022Mint: config.token2022Mint
          ? new PublicKey(config.token2022Mint)
          : undefined,
        wrappedAta: config.token2022Mint
          ? getAssociatedTokenAddressSync(
              new PublicKey(config.token2022Mint),
              wallet.publicKey,
              true,
              TOKEN_2022_PROGRAM_ID
            )
          : undefined,
      }
    );
  }

  static async buildForgiveTxns(
    pool: InputPoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    wallet: Wallet,
    obligationAddress: PublicKey,
    config: ActionConfigType
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "deposit",
      new BN(amount),
      wallet,
      connection,
      {
        ...config,
        customObligationAddress: obligationAddress,
      }
    );

    await axn.addSupportIxs("forgive");
    await axn.addForgiveIx();

    return axn;
  }

  static async buildDepositTxns(
    pool: InputPoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    wallet: Wallet,
    config: ActionConfigType
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "deposit",
      new BN(amount),
      wallet,
      connection,
      config
    );

    await axn.addSupportIxs("deposit");
    await axn.addDepositIx();

    return axn;
  }

  static async buildBorrowTxns(
    pool: InputPoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    wallet: Wallet,
    config: ActionConfigType
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "borrow",
      new BN(amount),
      wallet,
      connection,
      config
    );

    await axn.addSupportIxs("borrow");
    await axn.addBorrowIx();

    return axn;
  }
  static async buildDepositReserveLiquidityTxns(
    pool: InputPoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    wallet: Wallet,
    config: ActionConfigType
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "mint",
      new BN(amount),
      wallet,
      connection,
      config
    );
    await axn.addSupportIxs("mint");
    await axn.addDepositReserveLiquidityIx();
    return axn;
  }

  static async buildRedeemReserveCollateralTxns(
    pool: InputPoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    wallet: Wallet,
    config: ActionConfigType
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "redeem",
      new BN(amount),
      wallet,
      connection,
      config
    );
    await axn.addSupportIxs("redeem");
    await axn.addRedeemReserveCollateralIx();
    return axn;
  }

  static async buildDepositObligationCollateralTxns(
    pool: InputPoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    wallet: Wallet,
    config: ActionConfigType
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "depositCollateral",
      new BN(amount),
      wallet,
      connection,
      config
    );
    await axn.addSupportIxs("depositCollateral");
    await axn.addDepositObligationCollateralIx();
    return axn;
  }

  static async buildWithdrawCollateralTxns(
    pool: InputPoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    wallet: Wallet,
    config: ActionConfigType
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "withdrawCollateral",
      new BN(amount),
      wallet,
      connection,
      config
    );

    await axn.addSupportIxs("withdrawCollateral");
    await axn.addWithdrawIx();

    return axn;
  }

  static async buildWithdrawTxns(
    pool: InputPoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    wallet: Wallet,
    config: ActionConfigType
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "withdraw",
      new BN(amount),
      wallet,
      connection,
      config
    );

    await axn.addSupportIxs("withdraw");
    await axn.addWithdrawIx();

    return axn;
  }

  static async buildRepayTxns(
    pool: InputPoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    wallet: Wallet,
    config: ActionConfigType
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "repay",
      new BN(amount),
      wallet,
      connection,
      config
    );

    await axn.addSupportIxs("repay");
    await axn.addRepayIx();

    return axn;
  }

  static async buildLiquidateTxns(
    pool: InputPoolType,
    withdrawReserve: ReserveType,
    connection: Connection,
    amount: string,
    wallet: Wallet,
    config: ActionConfigType
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      withdrawReserve,
      "liquidate",
      new BN(amount),
      wallet,
      connection,
      config
    );

    await axn.addSupportIxs("liquidate");
    if (!config.repayReserve) throw new Error("Repay reserve is required");
    await axn.addLiquidateIx(config.repayReserve);

    return axn;
  }

  // Could fail for obligations with 6 positions and no lookup table
  async getVersionedTransaction() {
    return new VersionedTransaction(
      new TransactionMessage({
        payerKey: this.publicKey,
        recentBlockhash: (await this.connection.getRecentBlockhash()).blockhash,
        instructions: [
          ...this.preTxnIxs,
          ...this.setupIxs,
          ...this.lendingIxs,
          ...this.cleanupIxs,
          ...this.postTxnIxs,
        ],
      }).compileToV0Message(
        this.lookupTableAccount ? [this.lookupTableAccount] : []
      )
    );
  }

  async getLegacyTransactions() {
    const txns: {
      preLendingTxn: Transaction | null;
      lendingTxn: Transaction | null;
      postLendingTxn: Transaction | null;
    } = {
      preLendingTxn: null,
      lendingTxn: null,
      postLendingTxn: null,
    };
    if (this.preTxnIxs.length) {
      txns.preLendingTxn = new Transaction({
        feePayer: this.publicKey,
        recentBlockhash: (await this.connection.getRecentBlockhash()).blockhash,
      }).add(...this.preTxnIxs);
    }
    txns.lendingTxn = new Transaction({
      feePayer: this.publicKey,
      recentBlockhash: (await this.connection.getRecentBlockhash()).blockhash,
    }).add(...this.setupIxs, ...this.lendingIxs, ...this.cleanupIxs);
    if (this.postTxnIxs.length) {
      txns.postLendingTxn = new Transaction({
        feePayer: this.publicKey,
        recentBlockhash: (await this.connection.getRecentBlockhash()).blockhash,
      }).add(...this.postTxnIxs);
    }
    return txns;
  }

  private getTipIx() {
    const tipAccounts = [
      "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
      "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
      "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
      "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
      "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
      "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
      "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
      "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
    ];

    const tipAccount = new PublicKey(
      tipAccounts[Math.floor(Math.random() * tipAccounts.length)]
    );

    return SystemProgram.transfer({
      fromPubkey: this.publicKey,
      toPubkey: tipAccount,
      lamports: this.jitoTipAmount,
    });
  }

  async getTransactions(blockhash: BlockhashWithExpiryBlockHeight) {
    const txns: {
      preLendingTxn: VersionedTransaction | null;
      lendingTxn: VersionedTransaction | null;
      postLendingTxn: VersionedTransaction | null;
      pullPriceTxns: VersionedTransaction[] | null;
    } = {
      preLendingTxn: null,
      lendingTxn: null,
      postLendingTxn: null,
      pullPriceTxns: null,
    };

    if (this.pullPriceTxns.length) {
      txns.pullPriceTxns = this.pullPriceTxns;
    }

    if (this.preTxnIxs.length) {
      txns.preLendingTxn = new VersionedTransaction(
        new TransactionMessage({
          payerKey: this.publicKey,
          recentBlockhash: blockhash.blockhash,
          instructions: this.preTxnIxs,
        }).compileToV0Message()
      );
    }

    const instructions = [
      ...this.setupIxs,
      ...this.lendingIxs,
      ...this.cleanupIxs,
    ];

    const tip = this.getTipIx();
    if (tip && this.pullPriceTxns.length >= 5) {
      if (this.debug) console.log("adding tip ix to lending txn");
      instructions.push(tip);
    }

    const priorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 1_000_000,
    });
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: 1_000_000,
    });

    txns.lendingTxn = new VersionedTransaction(
      new TransactionMessage({
        payerKey: this.publicKey,
        recentBlockhash: blockhash.blockhash,
        instructions: [priorityFeeIx, modifyComputeUnits, ...instructions],
      }).compileToV0Message(
        this.lookupTableAccount ? [this.lookupTableAccount] : []
      )
    );

    if (this.postTxnIxs.length) {
      txns.postLendingTxn = new VersionedTransaction(
        new TransactionMessage({
          payerKey: this.publicKey,
          recentBlockhash: blockhash.blockhash,
          instructions: this.postTxnIxs,
        }).compileToV0Message()
      );
    }

    return txns;
  }

  configureTip(jitoTipAmount: number) {
    this.jitoTipAmount = jitoTipAmount;
  }

  addForgiveIx() {
    if (this.debug) console.log("adding forgive ix to lending txn");
    this.lendingIxs.push(
      forgiveDebtInstruction(
        this.obligationAddress,
        new PublicKey(this.reserve.address),
        new PublicKey(this.pool.address),
        new PublicKey(this.pool.owner),
        this.amount,
        this.programId
      )
    );
  }

  addDepositIx() {
    if (this.debug) console.log("adding deposit ix to lending txn");
    this.lendingIxs.push(
      this.amount.toString() === U64_MAX
        ? depositMaxReserveLiquidityAndObligationCollateralInstruction(
            this.userTokenAccountAddress,
            this.userCollateralAccountAddress,
            new PublicKey(this.reserve.address),
            new PublicKey(this.reserve.liquidityAddress),
            new PublicKey(this.reserve.cTokenMint),
            new PublicKey(this.pool.address),
            new PublicKey(this.pool.authorityAddress),
            new PublicKey(this.reserve.cTokenLiquidityAddress), // destinationCollateral
            this.obligationAddress, // obligation
            this.publicKey, // obligationOwner
            new PublicKey(this.reserve.pythOracle),
            new PublicKey(this.reserve.switchboardOracle),
            this.publicKey, // transferAuthority
            this.programId
          )
        : depositReserveLiquidityAndObligationCollateralInstruction(
            this.amount,
            this.userTokenAccountAddress,
            this.userCollateralAccountAddress,
            new PublicKey(this.reserve.address),
            new PublicKey(this.reserve.liquidityAddress),
            new PublicKey(this.reserve.cTokenMint),
            new PublicKey(this.pool.address),
            new PublicKey(this.pool.authorityAddress),
            new PublicKey(this.reserve.cTokenLiquidityAddress), // destinationCollateral
            this.obligationAddress, // obligation
            this.publicKey, // obligationOwner
            new PublicKey(this.reserve.pythOracle),
            new PublicKey(this.reserve.switchboardOracle),
            this.publicKey, // transferAuthority
            this.programId
          )
    );
  }

  addDepositReserveLiquidityIx() {
    if (this.debug) console.log("adding mint ix to lending txn");
    this.lendingIxs.push(
      depositReserveLiquidityInstruction(
        this.amount,
        this.userTokenAccountAddress,
        this.userCollateralAccountAddress,
        new PublicKey(this.reserve.address),
        new PublicKey(this.reserve.liquidityAddress),
        new PublicKey(this.reserve.cTokenMint),
        new PublicKey(this.pool.address),
        new PublicKey(this.pool.authorityAddress),
        this.publicKey, // transferAuthority
        this.programId
      )
    );
  }

  addRedeemReserveCollateralIx() {
    if (this.debug) console.log("adding redeem ix to lending txn");
    this.lendingIxs.push(
      redeemReserveCollateralInstruction(
        this.amount,
        this.userCollateralAccountAddress,
        this.userTokenAccountAddress,
        new PublicKey(this.reserve.address),
        new PublicKey(this.reserve.cTokenMint),
        new PublicKey(this.reserve.liquidityAddress),
        new PublicKey(this.pool.address), // pool
        new PublicKey(this.pool.authorityAddress), // poolAuthority
        this.publicKey, // transferAuthority
        this.programId
      )
    );
  }

  async addWithdrawObligationCollateralIx() {
    if (this.debug) console.log("adding withdrawCollateral ix to lending txn");
    this.lendingIxs.push(
      withdrawObligationCollateralInstruction(
        this.amount,
        new PublicKey(this.reserve.cTokenLiquidityAddress),
        this.userCollateralAccountAddress,
        new PublicKey(this.reserve.address),
        this.obligationAddress, // obligation
        new PublicKey(this.pool.address), // pool
        new PublicKey(this.pool.authorityAddress), // poolAuthority
        this.publicKey, // transferAuthority
        this.programId,
        this.depositReserves.map((reserve) => new PublicKey(reserve))
      )
    );
  }

  addDepositObligationCollateralIx() {
    if (this.debug) console.log("adding depositCollateral ix to lending txn");
    this.lendingIxs.push(
      depositObligationCollateralInstruction(
        this.amount,
        this.userCollateralAccountAddress,
        new PublicKey(this.reserve.cTokenLiquidityAddress),
        new PublicKey(this.reserve.address),
        this.obligationAddress, // obligation
        new PublicKey(this.pool.address),
        this.publicKey, // obligationOwner
        this.publicKey, // transferAuthority
        this.programId
      )
    );
  }

  addBorrowIx() {
    if (this.debug) console.log("adding borrow ix to lending txn");
    this.lendingIxs.push(
      borrowObligationLiquidityInstruction(
        this.amount,
        new PublicKey(this.reserve.liquidityAddress),
        this.userTokenAccountAddress,
        new PublicKey(this.reserve.address),
        new PublicKey(this.reserve.liquidityFeeReceiverAddress),
        this.obligationAddress,
        new PublicKey(this.pool.address), // lendingMarket
        new PublicKey(this.pool.authorityAddress), // lendingMarketAuthority
        this.publicKey,
        this.programId,
        this.depositReserves.map((reserve) => new PublicKey(reserve)),
        this.hostAta
      )
    );
  }

  async addWithdrawIx() {
    if (this.debug) console.log("adding withdraw ix to lending txn");
    this.lendingIxs.push(
      this.amount.eq(new BN(U64_MAX))
        ? withdrawObligationCollateralAndRedeemReserveLiquidity(
            new BN(U64_MAX),
            new PublicKey(this.reserve.cTokenLiquidityAddress),
            this.userCollateralAccountAddress,
            new PublicKey(this.reserve.address),
            this.obligationAddress,
            new PublicKey(this.pool.address),
            new PublicKey(this.pool.authorityAddress),
            this.userTokenAccountAddress, // destinationLiquidity
            new PublicKey(this.reserve.cTokenMint),
            new PublicKey(this.reserve.liquidityAddress),
            this.publicKey, // obligationOwner
            this.publicKey, // transferAuthority
            this.programId,
            this.depositReserves.map((reserve) => new PublicKey(reserve))
          )
        : withdrawExact(
            this.amount,
            new PublicKey(this.reserve.cTokenLiquidityAddress),
            this.userCollateralAccountAddress,
            new PublicKey(this.reserve.address),
            new PublicKey(this.userTokenAccountAddress),
            new PublicKey(this.reserve.cTokenMint),
            new PublicKey(this.reserve.liquidityAddress),
            new PublicKey(this.obligationAddress),
            new PublicKey(this.pool.address),
            new PublicKey(this.pool.authorityAddress),
            new PublicKey(this.publicKey),
            new PublicKey(this.publicKey),
            this.programId,
            this.depositReserves.map((reserve) => new PublicKey(reserve))
          )
    );
  }

  async addRepayIx() {
    if (this.debug) console.log("adding repay ix to lending txn");
    this.lendingIxs.push(
      this.amount.toString() === U64_MAX
        ? repayMaxObligationLiquidityInstruction(
            this.userTokenAccountAddress,
            new PublicKey(this.reserve.liquidityAddress),
            new PublicKey(this.reserve.address),
            this.obligationAddress,
            new PublicKey(this.pool.address),
            this.publicKey,
            this.programId
          )
        : repayObligationLiquidityInstruction(
            this.amount,
            this.userTokenAccountAddress,
            new PublicKey(this.reserve.liquidityAddress),
            new PublicKey(this.reserve.address),
            this.obligationAddress,
            new PublicKey(this.pool.address),
            this.publicKey,
            this.programId
          )
    );
  }

  async addLiquidateIx(repayReserve: ReserveType) {
    if (this.debug) console.log("adding liquidate ix to lending txn");
    if (
      !this.repayInfo?.userRepayCollateralAccountAddress ||
      !this.repayInfo?.userRepayTokenAccountAddress
    ) {
      throw Error("Not correctly initialized with a withdraw reserve.");
    }
    this.lendingIxs.push(
      liquidateObligationAndRedeemReserveCollateral(
        this.amount,
        this.repayInfo.userRepayTokenAccountAddress,
        this.userCollateralAccountAddress,
        this.userTokenAccountAddress,
        new PublicKey(repayReserve.address),
        new PublicKey(repayReserve.liquidityAddress),
        new PublicKey(this.reserve.address),
        new PublicKey(this.reserve.cTokenMint),
        new PublicKey(this.reserve.cTokenLiquidityAddress),
        new PublicKey(this.reserve.liquidityAddress),
        new PublicKey(this.reserve.feeReceiverAddress),
        this.obligationAddress,
        new PublicKey(this.pool.address),
        new PublicKey(this.pool.authorityAddress),
        this.publicKey,
        this.programId
      )
    );
  }

  async addSupportIxs(action: ActionType) {
    const supports = ACTION_SUPPORT_REQUIREMENTS[action];

    for (const support of supports) {
      switch (support) {
        case "createObligation":
          await this.addObligationIxs();
          break;
        case "wrap":
          if (this.wrappedAta) {
            await this.addWrapIx();
          }
          break;
        case "unwrap":
          if (this.wrappedAta) {
            await this.addUnwrapIx();
          }
          break;
        case "refreshReserves":
          await this.addRefreshReservesIxs();
          break;
        case "refreshObligation":
          await this.addRefreshObligationIxs();
          break;
        case "cAta":
          await this.addCAtaIxs();
          break;
        case "ata":
          await this.addAtaIxs();
          break;
        case "wrapRepay":
          if (this.repayInfo?.repayWrappedAta) {
            await this.addWrapRepayIx();
          }
          break;
        case "wsol":
          await this.updateWSOLAccount(action);
          break;
      }
    }
  }

  private async addWrapIx() {
    if (!this.wrappedAta || !this.token2022Mint)
      throw new Error("Wrapped ATA not initialized");
    if (this.debug) console.log("adding wrap ix to preTxnIxs");
    this.preTxnIxs.push(
      createAssociatedTokenAccountIdempotentInstruction(
        this.publicKey,
        this.userTokenAccountAddress,
        this.publicKey,
        new PublicKey(this.reserve.mintAddress)
      )
    );

    this.preTxnIxs.push(
      await createDepositAndMintWrapperTokensInstruction(
        this.publicKey,
        this.wrappedAta,
        this.token2022Mint,
        this.amount
      )
    );
  }

  private async addUnwrapIx() {
    if (!this.wrappedAta || !this.token2022Mint)
      throw new Error("Wrapped ATA not initialized");
    if (this.debug) console.log("adding wrap ix to preTxnIxs");
    this.preTxnIxs.push(
      createAssociatedTokenAccountIdempotentInstruction(
        this.publicKey,
        this.wrappedAta,
        this.publicKey,
        this.token2022Mint,
        TOKEN_2022_PROGRAM_ID
      )
    );

    if (this.debug) console.log("adding wrap ix to postTxnIxs");
    this.postTxnIxs.push(
      await createWithdrawAndBurnWrapperTokensInstruction(
        this.publicKey,
        this.wrappedAta,
        this.token2022Mint,
        new BN(U64_MAX)
      )
    );
  }

  private async addWrapRepayIx() {
    if (!this.repayInfo?.repayWrappedAta || !this.repayInfo?.repayToken2022Mint)
      throw new Error("Wrapped ATA not initialized");
    this.preTxnIxs.push(
      createAssociatedTokenAccountIdempotentInstruction(
        this.publicKey,
        this.repayInfo.userRepayTokenAccountAddress,
        this.publicKey,
        new PublicKey(this.repayInfo.repayMint)
      )
    );

    this.preTxnIxs.push(
      await createDepositAndMintWrapperTokensInstruction(
        this.publicKey,
        this.repayInfo.repayWrappedAta,
        this.repayInfo.repayToken2022Mint,
        this.amount
      )
    );
  }

  private async buildPullPriceTxns(oracleKeys: Array<string>) {
    const oracleAccounts = await this.connection.getMultipleAccountsInfo(
      oracleKeys.map((o) => new PublicKey(o)),
      "processed"
    );

    const provider = new AnchorProvider(this.connection, this.wallet, {});
    const idl = (await Program.fetchIdl(ON_DEMAND_MAINNET_PID, provider))!;

    if (this.environment === "production" || this.environment === "beta") {
      const sbod = new Program(idl, provider);

      const sbPulledOracles = oracleKeys.filter(
        (_o, index) =>
          oracleAccounts[index]?.owner.toBase58() === sbod.programId.toBase58()
      );

      if (sbPulledOracles.length) {
        const feedAccounts = await Promise.all(
          sbPulledOracles.map(
            (oracleKey) => new PullFeed(sbod as any, oracleKey)
          )
        );
        if (this.debug) console.log("Feed accounts", sbPulledOracles);
        const loadedFeedAccounts = await Promise.all(
          feedAccounts.map((acc) => acc.loadData())
        );

        const numSignatures = Math.max(
          ...loadedFeedAccounts.map(
            (f) => f.minSampleSize + Math.ceil(f.minSampleSize / 3)
          ),
          1
        );

        const crossbar = new CrossbarClient(
          "https://crossbar.switchboard.xyz/"
        );

        const res = sbPulledOracles.reduce((acc, _curr, i) => {
          if (!(i % 3)) {
            // if index is 0 or can be divided by the `size`...
            acc.push(sbPulledOracles.slice(i, i + 3)); // ..push a chunk of the original array to the accumulator
          }
          return acc;
        }, [] as string[][]);

        await Promise.all(
          res.map(async (oracleGroup) => {
            const [ix, accountLookups, responses] =
              await PullFeed.fetchUpdateManyIx(sbod, {
                feeds: oracleGroup.map((p) => new PublicKey(p)),
                numSignatures,
                crossbarClient: crossbar,
              });

            if (responses.errors.length) {
              console.error(responses.errors);
            }

            const lookupTables = (await loadLookupTables(feedAccounts)).concat(
              accountLookups
            );

            const priorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
              microLamports: 1_000_000,
            });
            const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit(
              {
                units: 1_000_000,
              }
            );

            const instructions = [priorityFeeIx, modifyComputeUnits, ix];

            if (this.debug)
              console.log("adding tip ix to pullPriceTxns for sbod");
            instructions.push(this.getTipIx());

            // Get the latest context
            const {
              value: { blockhash },
            } = await this.connection.getLatestBlockhashAndContext();

            // Get Transaction Message
            const message = new TransactionMessage({
              payerKey: this.publicKey,
              recentBlockhash: blockhash,
              instructions,
            }).compileToV0Message(lookupTables);

            // Get Versioned Transaction
            const vtx = new VersionedTransaction(message);

            if (this.debug) console.log("adding sbod ix to pullPriceTxns");
            this.pullPriceTxns.push(vtx);
          })
        );
      }
    }

    const priceServiceConnection = new PriceServiceConnection(
      "https://hermes.pyth.network"
    );
    const pythSolanaReceiver = new PythSolanaReceiver({
      connection: this.connection,
      wallet: this.wallet,
    });
    const transactionBuilder = pythSolanaReceiver.newTransactionBuilder({
      closeUpdateAccounts: true,
    });

    const pythPulledOracles = oracleAccounts.filter(
      (o) =>
        o?.owner.toBase58() === pythSolanaReceiver.receiver.programId.toBase58()
    );

    const shuffledPriceIds = (
      pythPulledOracles
        .map((pythOracleData, index) => {
          if (!pythOracleData) {
            throw new Error(`Could not find oracle data at index ${index}`);
          }
          const priceUpdate =
            pythSolanaReceiver.receiver.account.priceUpdateV2.coder.accounts.decode(
              "priceUpdateV2",
              pythOracleData.data
            );

          const needUpdate =
            Date.now() / 1000 -
              Number(priceUpdate.priceMessage.publishTime.toString()) >
            80;

          return needUpdate
            ? {
                key: Math.random(),
                priceFeedId: toHexString(priceUpdate.priceMessage.feedId),
              }
            : undefined;
        })
        .filter(Boolean) as Array<{
        key: number;
        priceFeedId: string;
      }>
    )
      .sort((a, b) => a.key - b.key)
      .map((x) => x.priceFeedId);

    if (shuffledPriceIds.length) {
      if (this.debug) console.log("Feed accounts", shuffledPriceIds);
      const priceFeedUpdateData = await priceServiceConnection.getLatestVaas(
        shuffledPriceIds
      );

      await transactionBuilder.addUpdatePriceFeed(
        priceFeedUpdateData,
        0 // shardId of 0
      );

      const transactionsWithSigners =
        await transactionBuilder.buildVersionedTransactions({
          tightComputeBudget: true,
          jitoTipLamports: this.pullPriceTxns.length
            ? undefined
            : this.jitoTipAmount,
        });

      for (const transaction of transactionsWithSigners) {
        const signers = transaction.signers;
        const tx = transaction.tx;
        if (signers) {
          tx.sign(signers);
        }
        this.pullPriceTxns.push(tx);
      }
      console.log(
        `adding ${transactionsWithSigners.length} txns to pullPriceTxns`
      );
    }
  }

  private async addRefreshReservesIxs() {
    // Union of addresses
    const reserveMap = this.pool.reserves.reduce((acc, reserve) => {
      acc[reserve.address] = reserve;
      return acc;
    }, {} as Record<string, ReserveType>);

    const allReserveAddresses = Array.from(
      new Set([
        ...this.depositReserves.map((e) => e.toBase58()),
        ...this.borrowReserves.map((e) => e.toBase58()),
        this.reserve.address,
      ])
    );

    console.log(allReserveAddresses);

    await this.buildPullPriceTxns([
      ...allReserveAddresses.map((address) => reserveMap[address].pythOracle),
      ...allReserveAddresses.map(
        (address) => reserveMap[address].switchboardOracle
      ),
      ...allReserveAddresses.map(
        (address) => reserveMap[address].extraOracle ?? NULL_ORACLE.toBase58()
      ),
    ]);

    allReserveAddresses.forEach((reserveAddress) => {
      const reserveInfo = this.pool.reserves.find(
        (reserve) => reserve.address === reserveAddress
      );
      if (!reserveInfo) {
        throw new Error(`Could not find asset ${reserveAddress} in reserves`);
      }
      if (this.debug)
        console.log(`adding refresh ${reserveAddress} ix to setup txn`);
      const refreshReserveIx = refreshReserveInstruction(
        new PublicKey(reserveAddress),
        this.programId,
        new PublicKey(reserveInfo.pythOracle),
        new PublicKey(reserveInfo.switchboardOracle),
        reserveInfo.extraOracle
          ? new PublicKey(reserveInfo.extraOracle)
          : undefined
      );
      this.setupIxs.push(refreshReserveIx);
    });
  }

  private async addRefreshObligationIxs() {
    const refreshObligationIx = refreshObligationInstruction(
      this.obligationAddress,
      this.depositReserves,
      this.borrowReserves,
      this.programId
    );
    if (this.debug) console.log("adding refresh obligation ix to setup txn");
    this.setupIxs.push(refreshObligationIx);
  }

  private async addObligationIxs() {
    if (this.debug) console.log("addObligationIxs");
    if (!this.obligationAccountInfo) {
      const obligationAccountInfoRentExempt =
        await this.connection.getMinimumBalanceForRentExemption(
          OBLIGATION_SIZE
        );

      if (this.debug)
        console.log("adding createAccount and initObligation ix to setup txn");
      this.setupIxs.push(
        SystemProgram.createAccountWithSeed({
          fromPubkey: this.publicKey,
          newAccountPubkey: this.obligationAddress,
          basePubkey: this.publicKey,
          seed: this.seed,
          lamports: obligationAccountInfoRentExempt,
          space: OBLIGATION_SIZE,
          programId: this.programId,
        })
      );
      const initObligationIx = initObligationInstruction(
        this.obligationAddress,
        new PublicKey(this.pool.address),
        this.publicKey,
        this.programId
      );
      this.setupIxs.push(initObligationIx);
    }
  }

  private async addAtaIxs() {
    if (this.reserve.mintAddress !== NATIVE_MINT.toBase58()) {
      const userTokenAccountInfo = await this.connection.getAccountInfo(
        this.userTokenAccountAddress
      );
      if (!userTokenAccountInfo) {
        const createUserTokenAccountIx =
          createAssociatedTokenAccountInstruction(
            this.publicKey,
            this.userTokenAccountAddress,
            this.publicKey,
            new PublicKey(this.reserve.mintAddress)
          );

        if (
          this.positions === POSITION_LIMIT &&
          this.hostAta &&
          !this.lookupTableAccount
        ) {
          if (this.debug) console.log("adding createAta ix to pre txn");
          this.preTxnIxs.push(createUserTokenAccountIx);
        } else {
          if (this.debug) console.log("adding createAta ix to setup txn");
          this.setupIxs.push(createUserTokenAccountIx);
        }
      }
    }
  }

  private async addCAtaIxs() {
    const userCollateralAccountInfo = await this.connection.getAccountInfo(
      this.userCollateralAccountAddress
    );

    if (!userCollateralAccountInfo) {
      const createUserCollateralAccountIx =
        createAssociatedTokenAccountInstruction(
          this.publicKey,
          this.userCollateralAccountAddress,
          this.publicKey,
          new PublicKey(this.reserve.cTokenMint)
        );

      if (
        this.positions === POSITION_LIMIT &&
        this.hostAta &&
        !this.lookupTableAccount
      ) {
        if (this.debug) console.log("adding createCAta ix to pre txn");
        this.preTxnIxs.push(createUserCollateralAccountIx);
      } else {
        if (this.debug) console.log("adding createCAta ix to setup txn");
        this.setupIxs.push(createUserCollateralAccountIx);
      }
    }
  }

  private async updateWSOLAccount(action: ActionType) {
    if (
      ![
        this.reserve.mintAddress,
        this.repayInfo?.repayMint.toString(),
      ].includes(NATIVE_MINT.toBase58())
    )
      return;

    const preIxs: Array<TransactionInstruction> = [];
    const postIxs: Array<TransactionInstruction> = [];

    let safeRepay = new BN(this.amount);
    const liquidateWithSol =
      action === "liquidate" &&
      this.repayInfo?.repayMint.toString() === NATIVE_MINT.toBase58();

    const solAccountAddress = liquidateWithSol
      ? this.repayInfo!.userRepayTokenAccountAddress
      : this.userTokenAccountAddress;
    const borrowReserveAddress = liquidateWithSol
      ? this.repayInfo!.reserveAddress.toBase58()
      : this.reserve.address;

    if (
      this.obligationAccountInfo &&
      (action === "repay" || liquidateWithSol) &&
      this.amount.eq(new BN(U64_MAX))
    ) {
      const buffer = await this.connection.getAccountInfo(
        new PublicKey(borrowReserveAddress),
        "processed"
      );

      if (!buffer) {
        throw Error(`Unable to fetch reserve data for ${borrowReserveAddress}`);
      }

      const parsedData = parseReserve(
        new PublicKey(borrowReserveAddress),
        buffer
      )?.info;

      if (!parsedData) {
        throw Error(`Unable to parse data of reserve ${borrowReserveAddress}`);
      }

      const borrow = this.obligationAccountInfo.borrows.find(
        (borrow) => borrow.borrowReserve.toBase58() === borrowReserveAddress
      );

      if (!borrow) {
        throw Error(
          `Unable to find obligation borrow to repay for ${this.obligationAccountInfo.owner.toBase58()}`
        );
      }

      safeRepay = new BN(
        Math.floor(
          new BigNumber(borrow.borrowedAmountWads.toString())
            .multipliedBy(
              parsedData.liquidity.cumulativeBorrowRateWads.toString()
            )
            .dividedBy(borrow.cumulativeBorrowRateWads.toString())
            .dividedBy(WAD)
            .plus(SOL_PADDING_FOR_INTEREST)
            .toNumber()
        ).toString()
      );
    }

    const userWSOLAccountInfo = await this.connection.getAccountInfo(
      solAccountAddress
    );

    const rentExempt = await getMinimumBalanceForRentExemptAccount(
      this.connection
    );

    const sendAction =
      action === "deposit" ||
      action === "repay" ||
      action === "mint" ||
      liquidateWithSol;
    const transferLamportsIx = SystemProgram.transfer({
      fromPubkey: this.publicKey,
      toPubkey: solAccountAddress,
      lamports:
        (userWSOLAccountInfo ? 0 : rentExempt) +
        (sendAction ? parseInt(safeRepay.toString(), 10) : 0),
    });
    if (this.debug) console.log("adding transferLamports ix");
    preIxs.push(transferLamportsIx);

    const closeWSOLAccountIx = createCloseAccountInstruction(
      solAccountAddress,
      this.publicKey,
      this.publicKey,
      []
    );

    if (userWSOLAccountInfo) {
      const syncIx = syncNative(solAccountAddress);
      if (sendAction) {
        if (this.debug) console.log("adding syncIx ix");
        preIxs.push(syncIx);
      } else {
        if (this.debug) console.log("adding closeWSOLAccountIx ix");
        postIxs.push(closeWSOLAccountIx);
      }
    } else {
      const createUserWSOLAccountIx = createAssociatedTokenAccountInstruction(
        this.publicKey,
        solAccountAddress,
        this.publicKey,
        NATIVE_MINT
      );
      if (this.debug) console.log("adding createUserWSOLAccountIx ix");
      preIxs.push(createUserWSOLAccountIx);
      if (this.debug) console.log("adding closeWSOLAccountIx ix");
      postIxs.push(closeWSOLAccountIx);
    }

    if (
      this.positions === POSITION_LIMIT &&
      this.hostAta &&
      !this.lookupTableAccount
    ) {
      if (this.debug) console.log("adding above ixs to pre and post txn");
      this.preTxnIxs.push(...preIxs);
      this.postTxnIxs.push(...postIxs);
    } else {
      if (this.debug) console.log("adding above ixs to lending txn");
      this.setupIxs.push(...preIxs);
      this.cleanupIxs.push(...postIxs);
    }
  }
}
