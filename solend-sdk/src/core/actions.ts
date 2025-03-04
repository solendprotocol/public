import {
  AddressLookupTableAccount,
  BlockhashWithExpiryBlockHeight,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Signer,
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
  loadLookupTables,
  PullFeed,
  ON_DEMAND_MAINNET_PID,
  CrossbarClient,
} from "@switchboard-xyz/on-demand";
import {
  createDepositAndMintWrapperTokensInstruction,
  createWithdrawAndBurnWrapperTokensInstruction,
} from "@solendprotocol/token2022-wrapper-sdk";
import { ReserveType } from "./utils";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

export type SaveWallet = {
  publicKey: PublicKey;
};

const SOL_PADDING_FOR_INTEREST = "1000000";

export type InputReserveType = {
  address: string;
  liquidityAddress: string;
  cTokenMint: string;
  cTokenLiquidityAddress: string;
  pythOracle: string;
  switchboardOracle: string;
  mintAddress: string;
  liquidityFeeReceiverAddress: string;
};

type ActionConfigType = {
  environment?: EnvironmentType;
  customObligationAddress?: PublicKey;
  hostAta?: PublicKey;
  hostPublicKey?: PublicKey;
  customObligationSeed?: string;
  lookupTableAddress?: PublicKey;
  repayReserve?: ReserveType;
  token2022Mint?: string;
  repayToken2022Mint?: string;
  depositInfo?: {
    userDepositTokenAccountAddress: PublicKey;
  };
  debug?: boolean;
  computeUnitPriceMicroLamports?: number;
  computeUnitLimit?: number;
};

type SupportType =
  | "wrap"
  | "unwrap"
  | "refreshReserve"
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
  redeem: ["wsol", "ata", "refreshReserve", "unwrap"],
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

type InputPoolReserveType = {
  address: string;
  pythOracle: string;
  switchboardOracle: string;
  mintAddress: string;
  liquidityFeeReceiverAddress: string;
  extraOracle?: string;
};

type InputPoolType = {
  address: string;
  owner: string;
  name: string | null;
  authorityAddress: string;
  reserves: Array<InputPoolReserveType>;
};

export type InstructionWithSigners = {
  instruction: TransactionInstruction;
  signers?: Array<Signer>;
  lookupTableAccounts?: AddressLookupTableAccount[];
  computeUnits: number;
};

export const createDepositAndMintWrapperTokensInstructionComputeUnits = 55_154;
export const createAssociatedTokenAccountIdempotentInstructionComputeUnits = 21_845;
export const withdrawAndBurnWrapperTokensInstructionComputeUnits = 52_649;
export const createAssociatedTokenAccountInstructionComputeUnits = 29_490;
export const createAccountComputeUnits = 10_000;
export const transferComputeUnits = 500;

export const CROSSBAR_URL1 = "https://crossbar.save.finance";
export const CROSSBAR_URL2 = "https://crossbar.switchboard.xyz";

export class SolendActionCore {
  programId: PublicKey;

  connection: Connection;

  reserve: InputReserveType;

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

  hostPublicKey?: PublicKey;

  // TODO: potentially don't need to keep signers
  pullPriceTxns: Array<VersionedTransaction>;

  oracleIxs: Array<InstructionWithSigners>;

  pythIxGroups: Array<Array<InstructionWithSigners>>;

  setupIxs: Array<InstructionWithSigners>;

  lendingIxs: Array<InstructionWithSigners>;

  cleanupIxs: Array<InstructionWithSigners>;

  preTxnIxs: Array<InstructionWithSigners>;

  postTxnIxs: Array<InstructionWithSigners>;

  depositReserves: Array<PublicKey>;

  borrowReserves: Array<PublicKey>;

  lookupTableAccount?: AddressLookupTableAccount;

  wallet: SaveWallet;

  debug: boolean;

  repayInfo?: {
    userRepayTokenAccountAddress: PublicKey;
    userRepayCollateralAccountAddress: PublicKey;
    repayToken2022Mint?: PublicKey;
    repayWrappedAta?: PublicKey;
    repayMint: PublicKey;
    reserveAddress: PublicKey;
  };

  depositInfo?: {
    userDepositTokenAccountAddress: PublicKey;
  };

  token2022Mint?: PublicKey;

  wrappedAta?: PublicKey;

  environment: EnvironmentType;

  computeUnitPriceMicroLamports?: number;

  computeUnitLimit?: number;

  errors: Array<any> = [];

  private constructor(
    programId: PublicKey,
    connection: Connection,
    reserve: InputReserveType,
    pool: InputPoolType,
    wallet: SaveWallet,
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
      hostPublicKey?: PublicKey;
      lookupTableAccount?: AddressLookupTableAccount;
      repayInfo?: {
        userRepayTokenAccountAddress: PublicKey;
        userRepayCollateralAccountAddress: PublicKey;
        repayToken2022Mint?: PublicKey;
        repayWrappedAta?: PublicKey;
        repayMint: PublicKey;
        reserveAddress: PublicKey;
      };
      depositInfo?: {
        userDepositTokenAccountAddress: PublicKey;
      };
      token2022Mint?: PublicKey;
      wrappedAta?: PublicKey;
      debug?: boolean;
      computeUnitPriceMicroLamports?: number;
      computeUnitLimit?: number;
    }
  ) {
    this.programId = programId;
    this.connection = connection;
    this.publicKey = wallet.publicKey;
    this.amount = new BN(amount);
    this.positions = positions;
    this.hostAta = config?.hostAta;
    this.hostPublicKey = config?.hostPublicKey;
    this.obligationAccountInfo = obligationAccountInfo;
    this.pool = pool;
    this.seed = seed;
    this.reserve = reserve;
    this.obligationAddress = obligationAddress;
    this.userTokenAccountAddress = userTokenAccountAddress;
    this.userCollateralAccountAddress = userCollateralAccountAddress;
    this.pullPriceTxns = [] as Array<VersionedTransaction>;
    this.pythIxGroups = [] as Array<Array<InstructionWithSigners>>;
    this.setupIxs = [];
    this.lendingIxs = [];
    this.cleanupIxs = [];
    this.preTxnIxs = [];
    this.postTxnIxs = [];
    this.oracleIxs = [];
    this.depositReserves = depositReserves;
    this.borrowReserves = borrowReserves;
    this.lookupTableAccount = config?.lookupTableAccount;
    this.depositInfo = config?.depositInfo;
    this.wallet = wallet;
    this.repayInfo = config?.repayInfo;
    this.token2022Mint = config?.token2022Mint;
    this.wrappedAta = config?.wrappedAta;
    // temporarily default to true
    this.debug = config?.debug ?? true;
    this.environment = config?.environment ?? "production";
    this.computeUnitPriceMicroLamports = config?.computeUnitPriceMicroLamports;
    this.computeUnitLimit = config?.computeUnitLimit;
  }

  static async initialize(
    pool: InputPoolType,
    reserve: InputReserveType,
    action: ActionType,
    amount: BN,
    wallet: SaveWallet,
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
        if (deposit.depositedAmount.gt(new BN(0))) {
          depositReserves.push(deposit.depositReserve);
        }
      });

      obligationDetails.borrows.forEach((borrow) => {
        if (borrow.borrowedAmountWads.gt(new BN(0))) {
          borrowReserves.push(borrow.borrowReserve);
        }
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

    if (
      distinctReserveCount > POSITION_LIMIT &&
      ["deposit", "borrow"].includes(action)
    ) {
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
        hostPublicKey: config.hostPublicKey,
        lookupTableAccount: lookupTableAccount ?? undefined,
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
        debug: config.debug,
        computeUnitPriceMicroLamports: config.computeUnitPriceMicroLamports,
        computeUnitLimit: config.computeUnitLimit,
      }
    );
  }

  static async buildForgiveTxns(
    pool: InputPoolType,
    reserve: InputReserveType,
    connection: Connection,
    amount: string,
    wallet: SaveWallet,
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
    reserve: InputReserveType,
    connection: Connection,
    amount: string,
    wallet: SaveWallet,
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
    reserve: InputReserveType,
    connection: Connection,
    amount: string,
    wallet: SaveWallet,
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
    reserve: InputReserveType,
    connection: Connection,
    amount: string,
    wallet: SaveWallet,
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
    reserve: InputReserveType,
    connection: Connection,
    amount: string,
    wallet: SaveWallet,
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
    reserve: InputReserveType,
    connection: Connection,
    amount: string,
    wallet: SaveWallet,
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
    reserve: InputReserveType,
    connection: Connection,
    amount: string,
    wallet: SaveWallet,
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
    reserve: InputReserveType,
    connection: Connection,
    amount: string,
    wallet: SaveWallet,
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
    reserve: InputReserveType,
    connection: Connection,
    amount: string,
    wallet: SaveWallet,
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
    withdrawReserve: InputReserveType,
    connection: Connection,
    amount: string,
    wallet: SaveWallet,
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
        recentBlockhash: (await this.connection.getLatestBlockhash()).blockhash,
        instructions: [
          ...this.preTxnIxs.map((ix) => ix.instruction),
          ...this.setupIxs.map((ix) => ix.instruction),
          ...this.lendingIxs.map((ix) => ix.instruction),
          ...this.cleanupIxs.map((ix) => ix.instruction),
          ...this.postTxnIxs.map((ix) => ix.instruction),
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
        recentBlockhash: (await this.connection.getLatestBlockhash()).blockhash,
      }).add(...this.preTxnIxs.map((ix) => ix.instruction));
    }
    txns.lendingTxn = new Transaction({
      feePayer: this.publicKey,
      recentBlockhash: (await this.connection.getLatestBlockhash()).blockhash,
    }).add(...this.setupIxs.map((ix) => ix.instruction), ...this.lendingIxs.map((ix) => ix.instruction), ...this.cleanupIxs.map((ix) => ix.instruction));
    if (this.postTxnIxs.length) {
      txns.postLendingTxn = new Transaction({
        feePayer: this.publicKey,
        recentBlockhash: (await this.connection.getLatestBlockhash()).blockhash,
      }).add(...this.postTxnIxs.map((ix) => ix.instruction));
    }
    return txns;
  }

  async getInstructions() {
    return {
      oracleIxs: this.oracleIxs,
      pythIxGroups: this.pythIxGroups,
      preLendingIxs: this.preTxnIxs,
      lendingIxs: this.setupIxs.concat(this.lendingIxs).concat(this.cleanupIxs),
      postLendingIxs: this.postTxnIxs,
    }
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

    const priorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: this.computeUnitPriceMicroLamports ?? 500_000,
    });

    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: this.computeUnitLimit ?? 1_000_000,
    });

    if (this.pullPriceTxns.length) {
      txns.pullPriceTxns = this.pullPriceTxns;
    }

    if (this.preTxnIxs.length) {
      txns.preLendingTxn = new VersionedTransaction(
        new TransactionMessage({
          payerKey: this.publicKey,
          recentBlockhash: blockhash.blockhash,
          instructions: [priorityFeeIx, modifyComputeUnits, ...this.preTxnIxs.map((ix) => ix.instruction)],
        }).compileToV0Message()
      );
    }

    const instructions = [
      ...this.setupIxs,
      ...this.lendingIxs,
      ...this.cleanupIxs,
    ];

    txns.lendingTxn = new VersionedTransaction(
      new TransactionMessage({
        payerKey: this.publicKey,
        recentBlockhash: blockhash.blockhash,
        instructions: [priorityFeeIx, modifyComputeUnits, ...instructions.map((ix) => ix.instruction)],
      }).compileToV0Message(
        this.lookupTableAccount ? [this.lookupTableAccount] : []
      )
    );

    if (this.postTxnIxs.length) {
      txns.postLendingTxn = new VersionedTransaction(
        new TransactionMessage({
          payerKey: this.publicKey,
          recentBlockhash: blockhash.blockhash,
          instructions: [priorityFeeIx, modifyComputeUnits, ...this.postTxnIxs.map((ix) => ix.instruction)],
        }).compileToV0Message()
      );
    }

    return txns;
  }

  addForgiveIx() {
    if (this.debug) console.log("adding forgive ix to lending txn");
    this.lendingIxs.push(
      {
        lookupTableAccounts: this.lookupTableAccount ? [this.lookupTableAccount] : undefined,
        instruction: forgiveDebtInstruction(
          this.obligationAddress,
          new PublicKey(this.reserve.address),
          new PublicKey(this.pool.address),
          new PublicKey(this.pool.owner),
          this.amount,
          this.programId,
        ),
        computeUnits: -1,
      }
    );
  }

  addDepositIx() {
    if (this.debug) console.log("adding deposit ix to lending txn");
    this.lendingIxs.push(
      {
        lookupTableAccounts: this.lookupTableAccount ? [this.lookupTableAccount] : undefined,
        instruction: this.amount.toString() === U64_MAX
        ? depositMaxReserveLiquidityAndObligationCollateralInstruction(
            this.depositInfo?.userDepositTokenAccountAddress ?? this.userTokenAccountAddress,
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
            this.depositInfo?.userDepositTokenAccountAddress ?? this.userTokenAccountAddress,
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
          ),
          computeUnits: this.amount.toString() === U64_MAX ? 102_007 : 83_271
      }
    );
  }

  addDepositReserveLiquidityIx() {
    if (this.debug) console.log("adding mint ix to lending txn");
    this.lendingIxs.push(
      {
        lookupTableAccounts: this.lookupTableAccount ? [this.lookupTableAccount] : undefined,
        instruction: depositReserveLiquidityInstruction(
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
        ),
        computeUnits: 56_142
      }
    );
  }

  addRedeemReserveCollateralIx() {
    if (this.debug) console.log("adding redeem ix to lending txn");
    this.lendingIxs.push(
      {
        lookupTableAccounts: this.lookupTableAccount ? [this.lookupTableAccount] : undefined,
        instruction: redeemReserveCollateralInstruction(
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
        ),
        computeUnits: 44_207
      }
    );
  }

  async addWithdrawObligationCollateralIx() {
    if (this.debug) console.log("adding withdrawCollateral ix to lending txn");
    this.lendingIxs.push(
      {
        lookupTableAccounts: this.lookupTableAccount ? [this.lookupTableAccount] : undefined,
        instruction: withdrawObligationCollateralInstruction(
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
        ),
        computeUnits: 22_932 + (this.positions ?? 0) * 10_000
      }
    );
  }

  addDepositObligationCollateralIx() {
    if (this.debug) console.log("adding depositCollateral ix to lending txn");
    this.lendingIxs.push(
      {
        lookupTableAccounts: this.lookupTableAccount ? [this.lookupTableAccount] : undefined,
        instruction: depositObligationCollateralInstruction(
          this.amount,
          this.userCollateralAccountAddress,
          new PublicKey(this.reserve.cTokenLiquidityAddress),
          new PublicKey(this.reserve.address),
          this.obligationAddress, // obligation
          new PublicKey(this.pool.address),
        this.publicKey, // obligationOwner
        this.publicKey, // transferAuthority
          this.programId,
        ),
        computeUnits: 17_944
      }
    );
  }

  addBorrowIx() {
    if (this.debug) console.log("adding borrow ix to lending txn");
    if (this.hostAta && this.hostPublicKey) {
      this.preTxnIxs.push(
        {
          instruction: createAssociatedTokenAccountIdempotentInstruction(
          this.publicKey,
          this.hostAta,
          this.hostPublicKey,
          new PublicKey(this.reserve.mintAddress)
        ),
        computeUnits: 21_845
      }
    );
    }
    this.lendingIxs.push(
      {
        lookupTableAccounts: this.lookupTableAccount ? [this.lookupTableAccount] : undefined,
        instruction: borrowObligationLiquidityInstruction(
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
        ),
        computeUnits: 87_660 + ((this.positions ?? 0) * 10_000)
      }
    );
  }

  async addWithdrawIx() {
    if (this.debug) console.log("adding withdraw ix to lending txn");
    this.lendingIxs.push(
      {
        lookupTableAccounts: this.lookupTableAccount ? [this.lookupTableAccount] : undefined,
        instruction: this.amount.eq(new BN(U64_MAX))
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
          ),
          computeUnits: this.amount.eq(new BN(U64_MAX)) ? (85_000 + ((this.positions ?? 0) * 10_000)) : 116_479 + ((this.positions ?? 0) * 10_000)
        }
    );
  }

  async addRepayIx() {
    if (this.debug) console.log("adding repay ix to lending txn");
    this.lendingIxs.push(
      {
        lookupTableAccounts: this.lookupTableAccount ? [this.lookupTableAccount] : undefined,
        instruction: this.amount.toString() === U64_MAX
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
          ),
          computeUnits: 63549,
      }
    );
  }

  async addLiquidateIx(repayReserve: InputReserveType) {
    if (this.debug) console.log("adding liquidate ix to lending txn");
    if (
      !this.repayInfo?.userRepayCollateralAccountAddress ||
      !this.repayInfo?.userRepayTokenAccountAddress
    ) {
      throw Error("Not correctly initialized with a withdraw reserve.");
    }
    this.lendingIxs.push(
      {
        lookupTableAccounts: this.lookupTableAccount ? [this.lookupTableAccount] : undefined,
        instruction: liquidateObligationAndRedeemReserveCollateral(
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
        new PublicKey(this.reserve.liquidityFeeReceiverAddress),
        this.obligationAddress,
        new PublicKey(this.pool.address),
        new PublicKey(this.pool.authorityAddress),
        this.publicKey,
        this.programId
      ),
      computeUnits: 80_000 + ((this.positions ?? 0) * 2_500)
      }
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
        case "refreshReserve":
          await this.addRefreshReservesIxs(true);
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
      {
        instruction: createAssociatedTokenAccountIdempotentInstruction(
          this.publicKey,
        this.userTokenAccountAddress,
        this.publicKey,
          new PublicKey(this.reserve.mintAddress)
        ),
        computeUnits: createAssociatedTokenAccountIdempotentInstructionComputeUnits
      }
    );

    this.preTxnIxs.push(
      {
      instruction: await createDepositAndMintWrapperTokensInstruction(
          this.publicKey,
        this.wrappedAta,
        this.token2022Mint,
        this.amount
        ),
        computeUnits: createDepositAndMintWrapperTokensInstructionComputeUnits
      }
    );
  }

  private async addUnwrapIx() {
    if (!this.wrappedAta || !this.token2022Mint)
      throw new Error("Wrapped ATA not initialized");
    if (this.debug) console.log("adding wrap ix to preTxnIxs");
    this.preTxnIxs.push(
      {
        instruction: createAssociatedTokenAccountIdempotentInstruction(
          this.publicKey,
        this.wrappedAta,
        this.publicKey,
        this.token2022Mint,
          TOKEN_2022_PROGRAM_ID
        ),
        computeUnits: createAssociatedTokenAccountIdempotentInstructionComputeUnits
      }
    );

    if (this.debug) console.log("adding wrap ix to postTxnIxs");
    this.postTxnIxs.push(
      {
        instruction: await createWithdrawAndBurnWrapperTokensInstruction(
          this.publicKey,
          this.wrappedAta,
          this.token2022Mint,
          new BN(U64_MAX)
        ),
        computeUnits: withdrawAndBurnWrapperTokensInstructionComputeUnits
      }
    );
  }

  private async addWrapRepayIx() {
    if (!this.repayInfo?.repayWrappedAta || !this.repayInfo?.repayToken2022Mint)
      throw new Error("Wrapped ATA not initialized");
    this.preTxnIxs.push(
      {
        instruction: createAssociatedTokenAccountIdempotentInstruction(
          this.publicKey,
          this.repayInfo.userRepayTokenAccountAddress,
          this.publicKey,
          new PublicKey(this.repayInfo.repayMint)
        ),
        computeUnits: 21_845
      }
    );

    this.preTxnIxs.push(
      {
        instruction: await createDepositAndMintWrapperTokensInstruction(
          this.publicKey,
          this.repayInfo.repayWrappedAta,
          this.repayInfo.repayToken2022Mint,
          this.amount
        ),
        computeUnits: 55_154
      }
    );
  }

  static async buildPullPriceIxsStatic(
    oracleKeys: Array<string>,
    connection: Connection,
    wallet: SaveWallet,
    computeUnitPriceMicroLamports?: number,
    environment?: EnvironmentType,
    debug?: boolean,
  ) {
    let oracleIxs: InstructionWithSigners[] = [];
    let pullPriceTxns: VersionedTransaction[] = [];
    let pythIxGroups: Array<Array<InstructionWithSigners>> = [];
    const priorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: computeUnitPriceMicroLamports ?? 1_000_000,
    });
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: 1_000_000,
    });

    const oracleAccounts = await connection.getMultipleAccountsInfo(
      oracleKeys.map((o) => new PublicKey(o)),
      "processed"
    );

    const provider = new AnchorProvider(connection, {
      publicKey: wallet.publicKey,
      signTransaction: <T extends Transaction | VersionedTransaction>(tx: T) => Promise.resolve(tx),
      signAllTransactions: <T extends Transaction | VersionedTransaction>(txs: T[]) => Promise.resolve(txs as T[]),
    }, {});
    const idl = (await Program.fetchIdl(ON_DEMAND_MAINNET_PID, provider))!;

    if (environment === "production" || environment === "beta") {
      const sbod = new Program(idl, provider);
      console.log(oracleAccounts);
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
        if (debug) console.log("Feed accounts", sbPulledOracles);
        const loadedFeedAccounts = await Promise.all(
          feedAccounts.map((acc) => acc.loadData())
        );

        const numSignatures = Math.max(
          ...loadedFeedAccounts.map(
            (f) => f.minSampleSize + Math.ceil(f.minSampleSize / 3)
          ),
          1
        );

        const res = sbPulledOracles.reduce((acc, _curr, i) => {
          if (!(i % 3)) {
            // if index is 0 or can be divided by the `size`...
            acc.push(sbPulledOracles.slice(i, i + 3)); // ..push a chunk of the original array to the accumulator
          }
          return acc;
        }, [] as string[][]);

        const crossbar = new CrossbarClient(CROSSBAR_URL2);
        await Promise.all(
          res.map(async (oracleGroup) => {
            const [ix, accountLookups, responses] =
            await PullFeed.fetchUpdateManyIx(sbod as any, {
              feeds: oracleGroup.map((p) => new PublicKey(p)),
              crossbarClient: crossbar,

                numSignatures,
              });

          // responses?.oracle_responses.forEach((response) => {
          //   response?.errors.forEach((error) => {
          //     if (error) {
          //       console.error(error);
          //     }
          //   });
          // });

          console.log('updated');

            const lookupTables = (await loadLookupTables(feedAccounts)).concat(
              accountLookups
            );

            const instructions = [priorityFeeIx, modifyComputeUnits, ix];

            // Get the latest context
            const {
              value: { blockhash },
            } = await connection.getLatestBlockhashAndContext();

            // Get Transaction Message
            const message = new TransactionMessage({
              payerKey: wallet.publicKey,
              recentBlockhash: blockhash,
              instructions,
            }).compileToV0Message(lookupTables);

            // Get Versioned Transaction
            const vtx = new VersionedTransaction(message);

            if (debug) console.log("adding sbod ix to pullPriceTxns");
            oracleIxs.push({
              instruction: ix,
              lookupTableAccounts: lookupTables,
              computeUnits: 400_000 + sbPulledOracles.length * 100_000, 
            });
            pullPriceTxns.push(vtx);
          })
        );
      }
    }

    const priceServiceConnection = new PriceServiceConnection(
      "https://hermes.pyth.network"
    );
    const pythSolanaReceiver = new PythSolanaReceiver({
      connection: connection,
      wallet: wallet as any as NodeWallet,
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
      if (debug) console.log("Feed accounts", shuffledPriceIds);
      const priceFeedUpdateData = await priceServiceConnection.getLatestVaas(
        shuffledPriceIds
      );

      await transactionBuilder.addUpdatePriceFeed(
        priceFeedUpdateData,
        0 // shardId of 0
      );

      transactionBuilder.addInstructions([
        { instruction: priorityFeeIx, signers: [] },
        { instruction: modifyComputeUnits, signers: [] },
      ]);

      const transactionsWithSigners =
        await transactionBuilder.buildVersionedTransactions({});

      for (const transaction of transactionsWithSigners) {
        const signers = transaction.signers;
        const tx = transaction.tx;
        const lookupTables = await Promise.all(tx.message.addressTableLookups.map((lookup) => connection.getAddressLookupTable(lookup.accountKey)));  

        if (signers) {
          tx.sign(signers);
        }
        pythIxGroups.push(transactionBuilder.transactionInstructions.flatMap((ixs, index1) => ixs.instructions.map(
          (ix, index2) => {
            let computeUnits = 0;
            if (index1 === 0 && index2 === 0) {
              computeUnits = 355_787;
            }
            if (ix.programId.toBase58() === 'pythWSnswVUd12oZpeFP8e9CVaEqJg25g1Vtc2biRsT') {
              computeUnits = 43825;
            }

            return ({
            instruction: ix,
            signers: ixs.signers,
            lookupTables: lookupTables,
            computeUnits,
          })}
        )));
        pullPriceTxns.push(tx);
      }
      console.log(
        `adding ${transactionsWithSigners.length} txns to pullPriceTxns`
      );
    }

    return {
      oracleIxs,
      pythIxGroups,
      pullPriceTxns,
    }
  }

  async buildPullPriceTxns(
    oracleKeys: Array<string>
  ) {
    const { oracleIxs, pythIxGroups, pullPriceTxns } = await SolendActionCore.buildPullPriceIxsStatic(oracleKeys, this.connection, this.wallet, this.computeUnitPriceMicroLamports ?? 1_000_000, this.environment, this.debug);
    this.oracleIxs.push(...oracleIxs);
    this.pythIxGroups.push(...pythIxGroups);
    this.pullPriceTxns.push(...pullPriceTxns);
  }

  private async addRefreshReservesIxs(singleReserve?: boolean) {
    // Union of addresses
    const reserveMap = this.pool.reserves.reduce((acc, reserve) => {
      acc[reserve.address] = reserve;
      return acc;
    }, {} as Record<string, InputPoolReserveType>);

    const allReserveAddresses = Array.from(
      new Set(singleReserve ? [this.reserve.address] : [
        ...this.depositReserves.map((e) => e.toBase58()),
        ...this.borrowReserves.map((e) => e.toBase58()),
        this.reserve.address,
      ])
    );

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
      this.setupIxs.push({
        instruction: refreshReserveIx,
        computeUnits: 54_690, // 54690 is max amount from a sample. TODO: can get more granular based on pyth/sb/extra oracle
      });
    });
  }

  private async addRefreshObligationIxs() {
    const refreshObligationIx = refreshObligationInstruction(
      this.obligationAddress,
      this.depositReserves,
      this.borrowReserves,
      this.programId
    );

    this.depositReserves = this.depositReserves.filter((reserve) => {
      const deposit = this.obligationAccountInfo?.deposits.find((d) => d.depositReserve.toBase58() === reserve.toBase58());
      return deposit?.depositedAmount.gt(new BN(0));
    });
    this.borrowReserves = this.borrowReserves.filter((reserve) => {
      const borrow = this.obligationAccountInfo?.borrows.find((b) => b.borrowReserve.toBase58() === reserve.toBase58());
      return borrow?.borrowedAmountWads.gt(new BN(0));
    });

    if (this.debug) console.log("adding refresh obligation ix to setup txn");
    this.setupIxs.push({
      instruction: refreshObligationIx,
      computeUnits: 30_000*(this.positions ?? 0),
    });
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
      this.setupIxs.push({
        instruction: SystemProgram.createAccountWithSeed({
          fromPubkey: this.publicKey,
          newAccountPubkey: this.obligationAddress,
          basePubkey: this.publicKey,
          seed: this.seed,
          lamports: obligationAccountInfoRentExempt,
          space: OBLIGATION_SIZE,
          programId: this.programId,
        }),
        computeUnits: createAccountComputeUnits,
      });
      const initObligationIx = initObligationInstruction(
        this.obligationAddress,
        new PublicKey(this.pool.address),
        this.publicKey,
        this.programId
      );
      this.setupIxs.push({
        instruction: initObligationIx,
        computeUnits: 4_701
      });
    }
  }

  private async addAtaIxs() {
    if (this.reserve.mintAddress !== NATIVE_MINT.toBase58()) {
      const userTokenAccountInfo = await this.connection.getAccountInfo(
        this.userTokenAccountAddress
      );
      if (!userTokenAccountInfo) {
        const createUserTokenAccountIx ={
          computeUnits: createAssociatedTokenAccountInstructionComputeUnits,
          instruction: createAssociatedTokenAccountInstruction(
            this.publicKey,
            this.userTokenAccountAddress,
            this.publicKey,
            new PublicKey(this.reserve.mintAddress)
          )};

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
        this.preTxnIxs.push({
          instruction: createUserCollateralAccountIx,
          computeUnits: createAssociatedTokenAccountInstructionComputeUnits
        });
      } else {
        if (this.debug) console.log("adding createCAta ix to setup txn");
        this.setupIxs.push({
          instruction: createUserCollateralAccountIx,
          computeUnits: createAssociatedTokenAccountInstructionComputeUnits
        });
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

    const preIxs: Array<InstructionWithSigners> = [];
    const postIxs: Array<InstructionWithSigners> = [];

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
    preIxs.push({
      instruction: transferLamportsIx,
      computeUnits: 6_200
    });

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
        preIxs.push({
          instruction: syncIx,
          computeUnits: 3_045
        });
      } else {
        if (this.debug) console.log("adding closeWSOLAccountIx ix");
        postIxs.push({
          instruction: closeWSOLAccountIx,
          computeUnits: 3033
        });
      }
    } else {
      const createUserWSOLAccountIx = createAssociatedTokenAccountInstruction(
        this.publicKey,
        solAccountAddress,
        this.publicKey,
        NATIVE_MINT
      );
      if (this.debug) console.log("adding createUserWSOLAccountIx ix");
      preIxs.push({
        instruction: createUserWSOLAccountIx,
        computeUnits: createAssociatedTokenAccountInstructionComputeUnits
      });
      if (this.debug) console.log("adding closeWSOLAccountIx ix");
      postIxs.push({
        instruction: closeWSOLAccountIx,
        computeUnits: 3033
      });
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
