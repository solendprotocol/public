import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
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
import {
  Obligation,
  OBLIGATION_SIZE,
  parseObligation,
} from "../../state/obligation";
import { parseReserve } from "../../state/reserve";
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
} from "../../instructions";
import { POSITION_LIMIT } from "../constants";
import { EnvironmentType, PoolType, ReserveType } from "../types";
import { getProgramId, U64_MAX, WAD } from "../../classes";

const SOL_PADDING_FOR_INTEREST = "1000000";

export type ActionType =
  | "deposit"
  | "borrow"
  | "withdraw"
  | "repay"
  | "mint"
  | "redeem"
  | "depositCollateral"
  | "withdrawCollateral";

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

  setupIxs: Array<TransactionInstruction>;

  lendingIxs: Array<TransactionInstruction>;

  cleanupIxs: Array<TransactionInstruction>;

  preTxnIxs: Array<TransactionInstruction>;

  postTxnIxs: Array<TransactionInstruction>;

  depositReserves: Array<PublicKey>;

  borrowReserves: Array<PublicKey>;

  private constructor(
    programId: PublicKey,
    connection: Connection,
    reserve: ReserveType,
    pool: PoolType,
    publicKey: PublicKey,
    obligationAddress: PublicKey,
    obligationAccountInfo: Obligation | null,
    userTokenAccountAddress: PublicKey,
    userCollateralAccountAddress: PublicKey,
    seed: string,
    positions: number,
    amount: BN,
    depositReserves: Array<PublicKey>,
    borrowReserves: Array<PublicKey>,
    hostAta?: PublicKey
  ) {
    this.programId = programId;
    this.connection = connection;
    this.publicKey = publicKey;
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
    this.setupIxs = [];
    this.lendingIxs = [];
    this.cleanupIxs = [];
    this.preTxnIxs = [];
    this.postTxnIxs = [];
    this.depositReserves = depositReserves;
    this.borrowReserves = borrowReserves;
  }

  static async initialize(
    pool: PoolType,
    reserve: ReserveType,
    action: ActionType,
    amount: BN,
    publicKey: PublicKey,
    connection: Connection,
    environment: EnvironmentType = "production",
    hostAta?: PublicKey
  ) {
    const seed = pool.address.slice(0, 32);
    const programId = getProgramId(environment);

    const obligationAddress = await PublicKey.createWithSeed(
      publicKey,
      seed,
      programId
    );

    const obligationAccountInfo = await connection.getAccountInfo(
      obligationAddress
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
      [
        ...Array.from(
          new Set([
            ...borrowReserves.map((e) => e.toBase58()),
            ...(action === "borrow" ? [reserve.address] : []),
          ])
        ),
      ].length +
      [
        ...Array.from(
          new Set([
            ...depositReserves.map((e) => e.toBase58()),
            ...(action === "deposit" ? [reserve.address] : []),
          ])
        ),
      ].length;

    if (distinctReserveCount > POSITION_LIMIT) {
      throw Error(
        `Obligation already has max number of positions: ${POSITION_LIMIT}`
      );
    }

    const userTokenAccountAddress = await getAssociatedTokenAddress(
      new PublicKey(reserve.mintAddress),
      publicKey,
      true
    );
    const userCollateralAccountAddress = await getAssociatedTokenAddress(
      new PublicKey(reserve.cTokenMint),
      publicKey,
      true
    );

    return new SolendActionCore(
      programId,
      connection,
      reserve,
      pool,
      publicKey,
      obligationAddress,
      obligationDetails,
      userTokenAccountAddress,
      userCollateralAccountAddress,
      seed,
      distinctReserveCount,
      amount,
      depositReserves,
      borrowReserves,
      hostAta
    );
  }

  static async buildDepositTxns(
    pool: PoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    publicKey: PublicKey,
    environment: EnvironmentType = "production"
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "deposit",
      new BN(amount),
      publicKey,
      connection,
      environment
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
    publicKey: PublicKey,
    environment: EnvironmentType = "production",
    hostAta?: PublicKey
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "borrow",
      new BN(amount),
      publicKey,
      connection,
      environment,
      hostAta
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
    publicKey: PublicKey,
    environment: EnvironmentType = "production"
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "mint",
      new BN(amount),
      publicKey,
      connection,
      environment
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
    publicKey: PublicKey,
    environment: EnvironmentType = "production"
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "redeem",
      new BN(amount),
      publicKey,
      connection,
      environment
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
    publicKey: PublicKey,
    environment: EnvironmentType = "production"
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "depositCollateral",
      new BN(amount),
      publicKey,
      connection,
      environment
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
    publicKey: PublicKey,
    environment: EnvironmentType = "production"
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "withdrawCollateral",
      new BN(amount),
      publicKey,
      connection,
      environment
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
    publicKey: PublicKey,
    environment: EnvironmentType = "production"
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "withdraw",
      new BN(amount),
      publicKey,
      connection,
      environment
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
    publicKey: PublicKey,
    environment: EnvironmentType = "production"
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "repay",
      new BN(amount),
      publicKey,
      connection,
      environment
    );

    await axn.addSupportIxs("repay");
    await axn.addRepayIx();

    return axn;
  }

  async getTransactions() {
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

  async sendTransactions(
    sendTransaction: (
      txn: Transaction,
      connection: Connection
    ) => Promise<TransactionSignature>,
    preCallback?: () => void,
    lendingCallback?: () => void,
    postCallback?: () => void
  ) {
    const txns = await this.getTransactions();

    await this.sendSingleTransaction(
      txns.preLendingTxn,
      sendTransaction,
      preCallback
    );

    const signature = await this.sendSingleTransaction(
      txns.lendingTxn,
      sendTransaction,
      lendingCallback
    );

    await this.sendSingleTransaction(
      txns.postLendingTxn,
      sendTransaction,
      postCallback
    );

    return signature;
  }

  private async sendSingleTransaction(
    txn: Transaction | null,
    sendTransaction: (
      txn: Transaction,
      connection: Connection
    ) => Promise<TransactionSignature>,
    callback?: () => void
  ) {
    if (!txn) return "";

    const signature = await sendTransaction(txn, this.connection);
    if (callback) {
      callback();
    }
    await this.connection.confirmTransaction(signature);

    return signature;
  }

  addDepositIx() {
    this.lendingIxs.push(
      depositReserveLiquidityAndObligationCollateralInstruction(
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
        new PublicKey(this.reserve.cTokenLiquidityAddress),
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
        new PublicKey(this.reserve.cTokenLiquidityAddress),
        new PublicKey(this.reserve.liquidityAddress),
        new PublicKey(this.pool.address), // pool
        new PublicKey(this.pool.authorityAddress), // poolAuthority
        this.publicKey, // transferAuthority
        this.programId
      )
    );
  }

  async addWithdrawObligationCollateralIx() {
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

    const totalBorrowsWads = parsedData.liquidity.borrowedAmountWads;
    const totalLiquidityWads = parsedData.liquidity.availableAmount.mul(
      new BN(WAD)
    );
    const totalDepositsWads = totalBorrowsWads.add(totalLiquidityWads);
    const cTokenExchangeRate = new BigNumber(totalDepositsWads.toString())
      .div(parsedData.collateral.mintTotalSupply.toString())
      .div(WAD);

    this.lendingIxs.push(
      withdrawObligationCollateralInstruction(
        this.amount.eq(new BN(U64_MAX))
          ? this.amount
          : new BN(
              new BigNumber(this.amount.toString())
                .dividedBy(cTokenExchangeRate)
                .toString()
            ),
        new PublicKey(this.reserve.cTokenLiquidityAddress),
        this.userCollateralAccountAddress,
        new PublicKey(this.reserve.address),
        this.obligationAddress, // obligation
        new PublicKey(this.pool.address), // pool
        new PublicKey(this.pool.authorityAddress), // poolAuthority
        this.publicKey, // transferAuthority
        this.programId
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
        this.hostAta
      )
    );
  }

  async addWithdrawIx() {
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

    const totalBorrowsWads = parsedData.liquidity.borrowedAmountWads;
    const totalLiquidityWads = parsedData.liquidity.availableAmount.mul(
      new BN(WAD)
    );
    const totalDepositsWads = totalBorrowsWads.add(totalLiquidityWads);
    const cTokenExchangeRate = new BigNumber(totalDepositsWads.toString())
      .div(parsedData.collateral.mintTotalSupply.toString())
      .div(WAD);

    this.lendingIxs.push(
      withdrawObligationCollateralAndRedeemReserveLiquidity(
        this.amount.eq(new BN(U64_MAX))
          ? this.amount
          : new BN(
              new BigNumber(this.amount.toString())
                .dividedBy(cTokenExchangeRate)
                .toString()
            ),
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
        this.programId
      )
    );
  }

  async addRepayIx() {
    this.lendingIxs.push(
      repayObligationLiquidityInstruction(
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
    if (["withdraw", "borrow", "withdrawCollateral"].includes(action)) {
      await this.addRefreshIxs();
    }
    if (!["mint", "redeem"].includes(action)) {
      await this.addObligationIxs();
    }
    await this.addAtaIxs(action);
  }

  private async addRefreshIxs() {
    // Union of addresses
    const allReserveAddresses = [
      ...Array.from([
        ...this.depositReserves.map((e) => e.toBase58()),
        ...this.borrowReserves.map((e) => e.toBase58()),
        this.reserve.address,
      ]),
    ];

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
        new PublicKey(reserveInfo.switchboardOracle)
      );
      this.setupIxs.push(refreshReserveIx);
    });

    const refreshObligationIx = refreshObligationInstruction(
      this.obligationAddress,
      this.depositReserves,
      this.borrowReserves,
      this.programId
    );
    this.setupIxs.push(refreshObligationIx);
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

        if (this.positions === POSITION_LIMIT && this.hostAta) {
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
          this.reserve.mintAddress === NATIVE_MINT.toBase58()
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

    if (this.positions && this.positions >= POSITION_LIMIT) {
      this.preTxnIxs.push(...preIxs);
      this.postTxnIxs.push(...postIxs);
    } else {
      this.setupIxs.push(...preIxs);
      this.cleanupIxs.push(...postIxs);
    }
  }
}
