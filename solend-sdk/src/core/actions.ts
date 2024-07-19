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
  createAssociatedTokenAccountInstruction,
  getMinimumBalanceForRentExemptAccount,
  createCloseAccountInstruction,
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
} from "../instructions";
import { NULL_ORACLE, POSITION_LIMIT } from "./constants";
import { EnvironmentType, PoolType, ReserveType } from "./types";
import { getProgramId, U64_MAX, WAD } from "./constants";
import { PriceServiceConnection } from "@pythnetwork/price-service-client";
import { AnchorProvider, Program } from "@coral-xyz/anchor-30";
import {
  CrossbarClient,
  loadLookupTables,
  PullFeed,
  SB_ON_DEMAND_PID,
} from "@switchboard-xyz/on-demand";
import { Wallet } from "@coral-xyz/anchor";

const SOL_PADDING_FOR_INTEREST = "1000000";

const toHexString = (byteArray: number[]) => {
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
  | "forgive";

export class SolendActionCore {
  programId: PublicKey;

  connection: Connection;

  reserve: ReserveType;

  pool: PoolType;

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

  ownerPublicKey?: PublicKey;

  jitoTipAmount: number;

  wallet: Wallet;

  private constructor(
    programId: PublicKey,
    connection: Connection,
    reserve: ReserveType,
    pool: PoolType,
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
    hostAta?: PublicKey,
    lookupTableAccount?: AddressLookupTableAccount,
    ownerPublicKey?: PublicKey,
    tipAmount?: number
  ) {
    this.programId = programId;
    this.connection = connection;
    this.publicKey = wallet.publicKey;
    this.amount = new BN(amount);
    this.positions = positions;
    this.hostAta = hostAta;
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
    this.lookupTableAccount = lookupTableAccount;
    this.ownerPublicKey = ownerPublicKey;
    this.jitoTipAmount = tipAmount ?? 1000;
    this.wallet = wallet;
  }

  static async initialize(
    pool: PoolType,
    reserve: ReserveType,
    action: ActionType,
    amount: BN,
    wallet: Wallet,
    connection: Connection,
    environment: EnvironmentType = "production",
    customObligationAddress?: PublicKey,
    hostAta?: PublicKey,
    customObligationSeed?: string,
    lookupTableAddress?: PublicKey,
    ownerPublicKey?: PublicKey,
    tipAmount?: number
  ) {
    const seed = customObligationSeed ?? pool.address.slice(0, 32);
    const programId = getProgramId(environment);

    const obligationAddress =
      customObligationAddress ??
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

    const lookupTableAccount = lookupTableAddress
      ? (await connection.getAddressLookupTable(lookupTableAddress)).value
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
      hostAta,
      lookupTableAccount ?? undefined,
      ownerPublicKey,
      tipAmount
    );
  }

  static async buildForgiveTxns(
    pool: PoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    wallet: Wallet,
    obligationAddress: PublicKey,
    environment: EnvironmentType = "production",
    lookupTableAddress?: PublicKey
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "deposit",
      new BN(amount),
      wallet,
      connection,
      environment,
      obligationAddress,
      undefined,
      undefined,
      lookupTableAddress
    );

    await axn.addSupportIxs("forgive");
    await axn.addForgiveIx();

    return axn;
  }

  static async buildDepositTxns(
    pool: PoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    wallet: Wallet,
    environment: EnvironmentType = "production",
    obligationAddress?: PublicKey,
    obligationSeed?: string,
    lookupTableAddress?: PublicKey
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "deposit",
      new BN(amount),
      wallet,
      connection,
      environment,
      obligationAddress,
      undefined,
      obligationSeed,
      lookupTableAddress
    );

    await axn.addSupportIxs("deposit");
    await axn.addDepositIx();

    return axn;
  }

  static async buildBorrowTxns(
    pool: PoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    wallet: Wallet,
    environment: EnvironmentType = "production",
    customObligationAddress?: PublicKey,
    hostAta?: PublicKey,
    lookupTableAddress?: PublicKey,
    tipAmount?: number
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "borrow",
      new BN(amount),
      wallet,
      connection,
      environment,
      customObligationAddress,
      hostAta,
      undefined,
      lookupTableAddress,
      undefined,
      tipAmount
    );

    await axn.addSupportIxs("borrow");
    await axn.addBorrowIx();

    return axn;
  }
  static async buildDepositReserveLiquidityTxns(
    pool: PoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    wallet: Wallet,
    environment: EnvironmentType = "production",
    lookupTableAddress?: PublicKey
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "mint",
      new BN(amount),
      wallet,
      connection,
      environment,
      undefined,
      undefined,
      undefined,
      lookupTableAddress
    );
    await axn.addSupportIxs("mint");
    await axn.addDepositReserveLiquidityIx();
    return axn;
  }

  static async buildRedeemReserveCollateralTxns(
    pool: PoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    wallet: Wallet,
    environment: EnvironmentType = "production",
    lookupTableAddress?: PublicKey
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "redeem",
      new BN(amount),
      wallet,
      connection,
      environment,
      undefined,
      undefined,
      undefined,
      lookupTableAddress
    );
    await axn.addSupportIxs("redeem");
    await axn.addRedeemReserveCollateralIx();
    return axn;
  }

  static async buildDepositObligationCollateralTxns(
    pool: PoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    wallet: Wallet,
    environment: EnvironmentType = "production",
    lookupTableAddress?: PublicKey,
    customObligationAddress?: PublicKey
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "depositCollateral",
      new BN(amount),
      wallet,
      connection,
      environment,
      customObligationAddress,
      undefined,
      undefined,
      lookupTableAddress
    );
    await axn.addSupportIxs("depositCollateral");
    await axn.addDepositObligationCollateralIx();
    return axn;
  }

  static async buildWithdrawCollateralTxns(
    pool: PoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    wallet: Wallet,
    environment: EnvironmentType = "production",
    lookupTableAddress?: PublicKey,
    customObligationAddress?: PublicKey
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "withdrawCollateral",
      new BN(amount),
      wallet,
      connection,
      environment,
      customObligationAddress,
      undefined,
      undefined,
      lookupTableAddress
    );

    await axn.addSupportIxs("withdrawCollateral");
    await axn.addWithdrawIx();

    return axn;
  }

  static async buildWithdrawTxns(
    pool: PoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    wallet: Wallet,
    environment: EnvironmentType = "production",
    obligationAddress?: PublicKey,
    obligationSeed?: string,
    lookupTableAddress?: PublicKey,
    tipAmount?: number
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "withdraw",
      new BN(amount),
      wallet,
      connection,
      environment,
      obligationAddress,
      undefined,
      obligationSeed,
      lookupTableAddress,
      undefined,
      tipAmount
    );

    await axn.addSupportIxs("withdraw");
    await axn.addWithdrawIx();

    return axn;
  }

  static async buildRepayTxns(
    pool: PoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    wallet: Wallet,
    environment: EnvironmentType = "production",
    customObligationAddress?: PublicKey,
    ownerPublicKey?: PublicKey,
    lookupTableAddress?: PublicKey
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "repay",
      new BN(amount),
      wallet,
      connection,
      environment,
      customObligationAddress,
      undefined,
      undefined,
      lookupTableAddress,
      ownerPublicKey
    );

    await axn.addSupportIxs("repay");
    await axn.addRepayIx();

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
      instructions.push(tip);
    }

    txns.lendingTxn = new VersionedTransaction(
      new TransactionMessage({
        payerKey: this.publicKey,
        recentBlockhash: blockhash.blockhash,
        instructions,
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

  async addSupportIxs(action: ActionType) {
    if (
      [
        "withdraw",
        "borrow",
        "withdrawCollateral",
        "forgive",
        "redeem",
      ].includes(action)
    ) {
      await this.addRefreshIxs(action);
    }
    if (!["mint", "redeem", "forgive"].includes(action)) {
      await this.addObligationIxs();
    }
    if (action !== "forgive") {
      await this.addAtaIxs(action);
    }
  }

  private async buildPullPriceTxns(oracleKeys: Array<string>) {
    const oracleAccounts = await this.connection.getMultipleAccountsInfo(
      oracleKeys.map((o) => new PublicKey(o)),
      "processed"
    );
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

    const provider = new AnchorProvider(this.connection, this.wallet, {});
    const idl = (await Program.fetchIdl(SB_ON_DEMAND_PID, provider))!;
    const sbod = new Program(idl, provider);

    const sbPulledOracles = oracleKeys.filter(
      (_o, index) =>
        oracleAccounts[index]?.owner.toBase58() === sbod.programId.toBase58()
    );
    const feedAccounts = sbPulledOracles.map(
      (oracleKey) => new PullFeed(sbod as any, oracleKey)
    );

    const feedData = await Promise.all(
      feedAccounts.map((feedAccount) => feedAccount.loadData())
    );

    const feedsThatNeedUpdate = feedData.map(
      (feed) =>
        Date.now() / 1000 - Number(feed.lastUpdateTimestamp.toString()) > 70
    );
    const updateFeeds = feedAccounts.filter(
      (_, index) => feedsThatNeedUpdate[index]
    );

    if (updateFeeds.length) {
      const crossbar = new CrossbarClient(
        "https://crossbar-fvumormova-uc.a.run.app"
      );

      // Responses is Array<[pullIx, responses, success]>
      const responses = await Promise.all(
        updateFeeds.map((feedAccount) =>
          feedAccount.fetchUpdateIx({
            crossbarClient: crossbar,
            gateway: "https://xoracle-1-mn.switchboard.xyz",
          })
        )
      );
      const oracles = responses.flatMap((x) => x[1].map((y) => y.oracle));
      const lookupTables = await loadLookupTables([...oracles, ...updateFeeds]);

      const priorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 100_000,
      });

      const instructions = [priorityFeeIx, ...responses.map((r) => r[0]!)];

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

      this.pullPriceTxns.push(vtx);
    }

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
            70;

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
          jitoTipLamports: sbPulledOracles.length
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
    }
  }

  private async addRefreshIxs(action: ActionType) {
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

    if (action !== "mint" && action !== "redeem") {
      const refreshObligationIx = refreshObligationInstruction(
        this.obligationAddress,
        this.depositReserves,
        this.borrowReserves,
        this.programId
      );
      this.setupIxs.push(refreshObligationIx);
    }
  }

  private async addObligationIxs() {
    if (!this.obligationAccountInfo) {
      const obligationAccountInfoRentExempt =
        await this.connection.getMinimumBalanceForRentExemption(
          OBLIGATION_SIZE
        );

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

  private async addAtaIxs(action: ActionType) {
    if (this.reserve.mintAddress === NATIVE_MINT.toBase58()) {
      await this.updateWSOLAccount(action);
    }

    if (
      (action === "withdraw" || action === "borrow" || action === "redeem") &&
      this.reserve.mintAddress !== NATIVE_MINT.toBase58()
    ) {
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
          this.preTxnIxs.push(createUserTokenAccountIx);
        } else {
          this.setupIxs.push(createUserTokenAccountIx);
        }
      }
    }

    if (action === "withdraw" || action === "mint" || action === "deposit") {
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
          this.preTxnIxs.push(createUserCollateralAccountIx);
        } else {
          this.setupIxs.push(createUserCollateralAccountIx);
        }
      }
    }
  }

  private async updateWSOLAccount(action: ActionType) {
    const preIxs: Array<TransactionInstruction> = [];
    const postIxs: Array<TransactionInstruction> = [];

    let safeRepay = new BN(this.amount);

    if (
      this.obligationAccountInfo &&
      action === "repay" &&
      this.amount.eq(new BN(U64_MAX))
    ) {
      const buffer = await this.connection.getAccountInfo(
        new PublicKey(this.reserve.address),
        "processed"
      );

      if (!buffer) {
        throw Error(`Unable to fetch reserve data for ${this.reserve.address}`);
      }

      const parsedData = parseReserve(
        new PublicKey(this.reserve.address),
        buffer
      )?.info;

      if (!parsedData) {
        throw Error(`Unable to parse data of reserve ${this.reserve.address}`);
      }

      const borrow = this.obligationAccountInfo.borrows.find(
        (borrow) => borrow.borrowReserve.toBase58() === this.reserve.address
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
      this.userTokenAccountAddress
    );

    const rentExempt = await getMinimumBalanceForRentExemptAccount(
      this.connection
    );

    const sendAction =
      action === "deposit" || action === "repay" || action === "mint";
    const transferLamportsIx = SystemProgram.transfer({
      fromPubkey: this.publicKey,
      toPubkey: this.userTokenAccountAddress,
      lamports:
        (userWSOLAccountInfo ? 0 : rentExempt) +
        (sendAction ? parseInt(safeRepay.toString(), 10) : 0),
    });
    preIxs.push(transferLamportsIx);

    const closeWSOLAccountIx = createCloseAccountInstruction(
      this.userTokenAccountAddress,
      this.publicKey,
      this.publicKey,
      []
    );

    if (userWSOLAccountInfo) {
      const syncIx = syncNative(this.userTokenAccountAddress);
      if (sendAction) {
        preIxs.push(syncIx);
      } else {
        postIxs.push(closeWSOLAccountIx);
      }
    } else {
      const createUserWSOLAccountIx = createAssociatedTokenAccountInstruction(
        this.publicKey,
        this.userTokenAccountAddress,
        this.publicKey,
        NATIVE_MINT
      );
      preIxs.push(createUserWSOLAccountIx);
      postIxs.push(closeWSOLAccountIx);
    }

    if (
      this.positions === POSITION_LIMIT &&
      this.hostAta &&
      !this.lookupTableAccount
    ) {
      this.preTxnIxs.push(...preIxs);
      this.postTxnIxs.push(...postIxs);
    } else {
      this.setupIxs.push(...preIxs);
      this.cleanupIxs.push(...postIxs);
    }
  }
}
