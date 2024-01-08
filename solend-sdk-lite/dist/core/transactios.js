"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolendActionCore = void 0;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const bn_js_1 = __importDefault(require("bn.js"));
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const obligation_1 = require("./../state/obligation");
const reserve_1 = require("./../state/reserve");
const instructions_1 = require("./../instructions");
const constants_1 = require("./constants");
const constants_2 = require("./constants");
const SOL_PADDING_FOR_INTEREST = "1000000";
class SolendActionCore {
  programId;
  connection;
  reserve;
  pool;
  publicKey;
  obligationAddress;
  obligationAccountInfo;
  userTokenAccountAddress;
  userCollateralAccountAddress;
  seed;
  positions;
  amount;
  hostAta;
  setupIxs;
  lendingIxs;
  cleanupIxs;
  preTxnIxs;
  postTxnIxs;
  depositReserves;
  borrowReserves;
  constructor(
    programId,
    connection,
    reserve,
    pool,
    publicKey,
    obligationAddress,
    obligationAccountInfo,
    userTokenAccountAddress,
    userCollateralAccountAddress,
    seed,
    positions,
    amount,
    depositReserves,
    borrowReserves,
    hostAta
  ) {
    this.programId = programId;
    this.connection = connection;
    this.publicKey = publicKey;
    this.amount = new bn_js_1.default(amount);
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
    pool,
    reserve,
    action,
    amount,
    publicKey,
    connection,
    environment = "production",
    customObligationAddress,
    hostAta
  ) {
    const seed = pool.address.slice(0, 32);
    const programId = (0, constants_2.getProgramId)(environment);
    const obligationAddress =
      customObligationAddress ??
      (await web3_js_1.PublicKey.createWithSeed(publicKey, seed, programId));
    const obligationAccountInfo = await connection.getAccountInfo(
      obligationAddress
    );
    let obligationDetails = null;
    const depositReserves = [];
    const borrowReserves = [];
    if (obligationAccountInfo) {
      obligationDetails = (0, obligation_1.parseObligation)(
        web3_js_1.PublicKey.default,
        obligationAccountInfo
      ).info;
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
    if (distinctReserveCount > constants_1.POSITION_LIMIT) {
      throw Error(
        `Obligation already has max number of positions: ${constants_1.POSITION_LIMIT}`
      );
    }
    const userTokenAccountAddress = await (0,
    spl_token_1.getAssociatedTokenAddress)(
      new web3_js_1.PublicKey(reserve.mintAddress),
      publicKey,
      true
    );
    const userCollateralAccountAddress = await (0,
    spl_token_1.getAssociatedTokenAddress)(
      new web3_js_1.PublicKey(reserve.cTokenMint),
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
  static async buildForgiveTxns(
    pool,
    reserve,
    connection,
    amount,
    publicKey,
    obligationAddress,
    environment = "production"
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "deposit",
      new bn_js_1.default(amount),
      publicKey,
      connection,
      environment,
      obligationAddress
    );
    await axn.addSupportIxs("forgive");
    await axn.addForgiveIx();
    return axn;
  }
  static async buildDepositTxns(
    pool,
    reserve,
    connection,
    amount,
    publicKey,
    environment = "production",
    obligationAddress
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "deposit",
      new bn_js_1.default(amount),
      publicKey,
      connection,
      environment,
      obligationAddress
    );
    await axn.addSupportIxs("deposit");
    await axn.addDepositIx();
    return axn;
  }
  static async buildBorrowTxns(
    pool,
    reserve,
    connection,
    amount,
    publicKey,
    environment = "production",
    hostAta
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "borrow",
      new bn_js_1.default(amount),
      publicKey,
      connection,
      environment,
      undefined,
      hostAta
    );
    await axn.addSupportIxs("borrow");
    await axn.addBorrowIx();
    return axn;
  }
  static async buildDepositReserveLiquidityTxns(
    pool,
    reserve,
    connection,
    amount,
    publicKey,
    environment = "production"
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "mint",
      new bn_js_1.default(amount),
      publicKey,
      connection,
      environment
    );
    await axn.addSupportIxs("mint");
    await axn.addDepositReserveLiquidityIx();
    return axn;
  }
  static async buildRedeemReserveCollateralTxns(
    pool,
    reserve,
    connection,
    amount,
    publicKey,
    environment = "production"
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "redeem",
      new bn_js_1.default(amount),
      publicKey,
      connection,
      environment
    );
    await axn.addSupportIxs("redeem");
    await axn.addRedeemReserveCollateralIx();
    return axn;
  }
  static async buildDepositObligationCollateralTxns(
    pool,
    reserve,
    connection,
    amount,
    publicKey,
    environment = "production"
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "depositCollateral",
      new bn_js_1.default(amount),
      publicKey,
      connection,
      environment
    );
    await axn.addSupportIxs("depositCollateral");
    await axn.addDepositObligationCollateralIx();
    return axn;
  }
  static async buildWithdrawCollateralTxns(
    pool,
    reserve,
    connection,
    amount,
    publicKey,
    environment = "production"
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "withdrawCollateral",
      new bn_js_1.default(amount),
      publicKey,
      connection,
      environment
    );
    await axn.addSupportIxs("withdrawCollateral");
    await axn.addWithdrawIx();
    return axn;
  }
  static async buildWithdrawTxns(
    pool,
    reserve,
    connection,
    amount,
    publicKey,
    environment = "production"
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "withdraw",
      new bn_js_1.default(amount),
      publicKey,
      connection,
      environment
    );
    await axn.addSupportIxs("withdraw");
    await axn.addWithdrawIx();
    return axn;
  }
  static async buildRepayTxns(
    pool,
    reserve,
    connection,
    amount,
    publicKey,
    environment = "production"
  ) {
    const axn = await SolendActionCore.initialize(
      pool,
      reserve,
      "repay",
      new bn_js_1.default(amount),
      publicKey,
      connection,
      environment
    );
    await axn.addSupportIxs("repay");
    await axn.addRepayIx();
    return axn;
  }
  async getTransactions() {
    const txns = {
      preLendingTxn: null,
      lendingTxn: null,
      postLendingTxn: null,
    };
    if (this.preTxnIxs.length) {
      txns.preLendingTxn = new web3_js_1.Transaction({
        feePayer: this.publicKey,
        recentBlockhash: (await this.connection.getRecentBlockhash()).blockhash,
      }).add(...this.preTxnIxs);
    }
    txns.lendingTxn = new web3_js_1.Transaction({
      feePayer: this.publicKey,
      recentBlockhash: (await this.connection.getRecentBlockhash()).blockhash,
    }).add(...this.setupIxs, ...this.lendingIxs, ...this.cleanupIxs);
    if (this.postTxnIxs.length) {
      txns.postLendingTxn = new web3_js_1.Transaction({
        feePayer: this.publicKey,
        recentBlockhash: (await this.connection.getRecentBlockhash()).blockhash,
      }).add(...this.postTxnIxs);
    }
    return txns;
  }
  async sendTransactions(
    sendTransaction,
    preCallback,
    lendingCallback,
    postCallback
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
  async sendSingleTransaction(txn, sendTransaction, callback) {
    if (!txn) return "";
    const signature = await sendTransaction(txn, this.connection);
    if (callback) {
      callback();
    }
    await this.connection.confirmTransaction(signature);
    return signature;
  }
  addForgiveIx() {
    this.lendingIxs.push(
      (0, instructions_1.forgiveDebtInstruction)(
        this.obligationAddress,
        new web3_js_1.PublicKey(this.reserve.address),
        new web3_js_1.PublicKey(this.pool.address),
        new web3_js_1.PublicKey(this.pool.owner),
        this.amount,
        this.programId
      )
    );
  }
  addDepositIx() {
    this.lendingIxs.push(
      (0,
      instructions_1.depositReserveLiquidityAndObligationCollateralInstruction)(
        this.amount,
        this.userTokenAccountAddress,
        this.userCollateralAccountAddress,
        new web3_js_1.PublicKey(this.reserve.address),
        new web3_js_1.PublicKey(this.reserve.liquidityAddress),
        new web3_js_1.PublicKey(this.reserve.cTokenMint),
        new web3_js_1.PublicKey(this.pool.address),
        new web3_js_1.PublicKey(this.pool.authorityAddress),
        new web3_js_1.PublicKey(this.reserve.cTokenLiquidityAddress), // destinationCollateral
        this.obligationAddress, // obligation
        this.publicKey, // obligationOwner
        new web3_js_1.PublicKey(this.reserve.pythOracle),
        new web3_js_1.PublicKey(this.reserve.switchboardOracle),
        this.publicKey, // transferAuthority
        this.programId
      )
    );
  }
  addDepositReserveLiquidityIx() {
    this.lendingIxs.push(
      (0, instructions_1.depositReserveLiquidityInstruction)(
        this.amount,
        this.userTokenAccountAddress,
        this.userCollateralAccountAddress,
        new web3_js_1.PublicKey(this.reserve.address),
        new web3_js_1.PublicKey(this.reserve.liquidityAddress),
        new web3_js_1.PublicKey(this.reserve.cTokenLiquidityAddress),
        new web3_js_1.PublicKey(this.pool.address),
        new web3_js_1.PublicKey(this.pool.authorityAddress),
        this.publicKey, // transferAuthority
        this.programId
      )
    );
  }
  addRedeemReserveCollateralIx() {
    this.lendingIxs.push(
      (0, instructions_1.redeemReserveCollateralInstruction)(
        this.amount,
        this.userCollateralAccountAddress,
        this.userTokenAccountAddress,
        new web3_js_1.PublicKey(this.reserve.address),
        new web3_js_1.PublicKey(this.reserve.cTokenLiquidityAddress),
        new web3_js_1.PublicKey(this.reserve.liquidityAddress),
        new web3_js_1.PublicKey(this.pool.address), // pool
        new web3_js_1.PublicKey(this.pool.authorityAddress), // poolAuthority
        this.publicKey, // transferAuthority
        this.programId
      )
    );
  }
  async addWithdrawObligationCollateralIx() {
    const buffer = await this.connection.getAccountInfo(
      new web3_js_1.PublicKey(this.reserve.address),
      "processed"
    );
    if (!buffer) {
      throw Error(`Unable to fetch reserve data for ${this.reserve.address}`);
    }
    const parsedData = (0, reserve_1.parseReserve)(
      new web3_js_1.PublicKey(this.reserve.address),
      buffer
    )?.info;
    if (!parsedData) {
      throw Error(`Unable to parse data of reserve ${this.reserve.address}`);
    }
    const totalBorrowsWads = parsedData.liquidity.borrowedAmountWads;
    const totalLiquidityWads = parsedData.liquidity.availableAmount.mul(
      new bn_js_1.default(constants_2.WAD)
    );
    const totalDepositsWads = totalBorrowsWads.add(totalLiquidityWads);
    const cTokenExchangeRate = new bignumber_js_1.default(
      totalDepositsWads.toString()
    )
      .div(parsedData.collateral.mintTotalSupply.toString())
      .div(constants_2.WAD);
    this.lendingIxs.push(
      (0, instructions_1.withdrawObligationCollateralInstruction)(
        this.amount.eq(new bn_js_1.default(constants_2.U64_MAX))
          ? this.amount
          : new bn_js_1.default(
              new bignumber_js_1.default(this.amount.toString())
                .dividedBy(cTokenExchangeRate)
                .integerValue(bignumber_js_1.default.ROUND_FLOOR)
                .toString()
            ),
        new web3_js_1.PublicKey(this.reserve.cTokenLiquidityAddress),
        this.userCollateralAccountAddress,
        new web3_js_1.PublicKey(this.reserve.address),
        this.obligationAddress, // obligation
        new web3_js_1.PublicKey(this.pool.address), // pool
        new web3_js_1.PublicKey(this.pool.authorityAddress), // poolAuthority
        this.publicKey, // transferAuthority
        this.programId
      )
    );
  }
  addDepositObligationCollateralIx() {
    this.lendingIxs.push(
      (0, instructions_1.depositObligationCollateralInstruction)(
        this.amount,
        this.userCollateralAccountAddress,
        new web3_js_1.PublicKey(this.reserve.cTokenLiquidityAddress),
        new web3_js_1.PublicKey(this.reserve.address),
        this.obligationAddress, // obligation
        new web3_js_1.PublicKey(this.pool.address),
        this.publicKey, // obligationOwner
        this.publicKey, // transferAuthority
        this.programId
      )
    );
  }
  addBorrowIx() {
    this.lendingIxs.push(
      (0, instructions_1.borrowObligationLiquidityInstruction)(
        this.amount,
        new web3_js_1.PublicKey(this.reserve.liquidityAddress),
        this.userTokenAccountAddress,
        new web3_js_1.PublicKey(this.reserve.address),
        new web3_js_1.PublicKey(this.reserve.liquidityFeeReceiverAddress),
        this.obligationAddress,
        new web3_js_1.PublicKey(this.pool.address), // lendingMarket
        new web3_js_1.PublicKey(this.pool.authorityAddress), // lendingMarketAuthority
        this.publicKey,
        this.programId,
        this.hostAta
      )
    );
  }
  async addWithdrawIx() {
    const buffer = await this.connection.getAccountInfo(
      new web3_js_1.PublicKey(this.reserve.address),
      "processed"
    );
    if (!buffer) {
      throw Error(`Unable to fetch reserve data for ${this.reserve.address}`);
    }
    const parsedData = (0, reserve_1.parseReserve)(
      new web3_js_1.PublicKey(this.reserve.address),
      buffer
    )?.info;
    if (!parsedData) {
      throw Error(`Unable to parse data of reserve ${this.reserve.address}`);
    }
    const totalBorrowsWads = parsedData.liquidity.borrowedAmountWads;
    const totalLiquidityWads = parsedData.liquidity.availableAmount.mul(
      new bn_js_1.default(constants_2.WAD)
    );
    const totalDepositsWads = totalBorrowsWads.add(totalLiquidityWads);
    const cTokenExchangeRate = new bignumber_js_1.default(
      totalDepositsWads.toString()
    )
      .div(parsedData.collateral.mintTotalSupply.toString())
      .div(constants_2.WAD);
    this.lendingIxs.push(
      (0, instructions_1.withdrawObligationCollateralAndRedeemReserveLiquidity)(
        this.amount.eq(new bn_js_1.default(constants_2.U64_MAX))
          ? this.amount
          : new bn_js_1.default(
              new bignumber_js_1.default(this.amount.toString())
                .dividedBy(cTokenExchangeRate)
                .integerValue(bignumber_js_1.default.ROUND_FLOOR)
                .toString()
            ),
        new web3_js_1.PublicKey(this.reserve.cTokenLiquidityAddress),
        this.userCollateralAccountAddress,
        new web3_js_1.PublicKey(this.reserve.address),
        this.obligationAddress,
        new web3_js_1.PublicKey(this.pool.address),
        new web3_js_1.PublicKey(this.pool.authorityAddress),
        this.userTokenAccountAddress, // destinationLiquidity
        new web3_js_1.PublicKey(this.reserve.cTokenMint),
        new web3_js_1.PublicKey(this.reserve.liquidityAddress),
        this.publicKey, // obligationOwner
        this.publicKey, // transferAuthority
        this.programId
      )
    );
  }
  async addRepayIx() {
    this.lendingIxs.push(
      (0, instructions_1.repayObligationLiquidityInstruction)(
        this.amount,
        this.userTokenAccountAddress,
        new web3_js_1.PublicKey(this.reserve.liquidityAddress),
        new web3_js_1.PublicKey(this.reserve.address),
        this.obligationAddress,
        new web3_js_1.PublicKey(this.pool.address),
        this.publicKey,
        this.programId
      )
    );
  }
  async addSupportIxs(action) {
    if (
      ["withdraw", "borrow", "withdrawCollateral", "forgive"].includes(action)
    ) {
      await this.addRefreshIxs();
    }
    if (!["mint", "redeem", "forgive"].includes(action)) {
      await this.addObligationIxs();
    }
    if (action !== "forgive") {
      await this.addAtaIxs(action);
    }
  }
  async addRefreshIxs() {
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
      const refreshReserveIx = (0, instructions_1.refreshReserveInstruction)(
        new web3_js_1.PublicKey(reserveAddress),
        this.programId,
        new web3_js_1.PublicKey(reserveInfo.pythOracle),
        new web3_js_1.PublicKey(reserveInfo.switchboardOracle)
      );
      this.setupIxs.push(refreshReserveIx);
    });
    const refreshObligationIx = (0,
    instructions_1.refreshObligationInstruction)(
      this.obligationAddress,
      this.depositReserves,
      this.borrowReserves,
      this.programId
    );
    this.setupIxs.push(refreshObligationIx);
  }
  async addObligationIxs() {
    if (!this.obligationAccountInfo) {
      const obligationAccountInfoRentExempt =
        await this.connection.getMinimumBalanceForRentExemption(
          obligation_1.OBLIGATION_SIZE
        );
      this.setupIxs.push(
        web3_js_1.SystemProgram.createAccountWithSeed({
          fromPubkey: this.publicKey,
          newAccountPubkey: this.obligationAddress,
          basePubkey: this.publicKey,
          seed: this.seed,
          lamports: obligationAccountInfoRentExempt,
          space: obligation_1.OBLIGATION_SIZE,
          programId: this.programId,
        })
      );
      const initObligationIx = (0, instructions_1.initObligationInstruction)(
        this.obligationAddress,
        new web3_js_1.PublicKey(this.pool.address),
        this.publicKey,
        this.programId
      );
      this.setupIxs.push(initObligationIx);
    }
  }
  async addAtaIxs(action) {
    if (this.reserve.mintAddress === spl_token_1.NATIVE_MINT.toBase58()) {
      await this.updateWSOLAccount(action);
    }
    if (
      (action === "withdraw" || action === "borrow" || action === "redeem") &&
      this.reserve.mintAddress !== spl_token_1.NATIVE_MINT.toBase58()
    ) {
      const userTokenAccountInfo = await this.connection.getAccountInfo(
        this.userTokenAccountAddress
      );
      if (!userTokenAccountInfo) {
        const createUserTokenAccountIx = (0,
        spl_token_1.createAssociatedTokenAccountInstruction)(
          this.publicKey,
          this.userTokenAccountAddress,
          this.publicKey,
          new web3_js_1.PublicKey(this.reserve.mintAddress)
        );
        if (this.positions === constants_1.POSITION_LIMIT && this.hostAta) {
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
        const createUserCollateralAccountIx = (0,
        spl_token_1.createAssociatedTokenAccountInstruction)(
          this.publicKey,
          this.userCollateralAccountAddress,
          this.publicKey,
          new web3_js_1.PublicKey(this.reserve.cTokenMint)
        );
        if (
          this.positions === constants_1.POSITION_LIMIT &&
          this.reserve.mintAddress === spl_token_1.NATIVE_MINT.toBase58()
        ) {
          this.preTxnIxs.push(createUserCollateralAccountIx);
        } else {
          this.setupIxs.push(createUserCollateralAccountIx);
        }
      }
    }
  }
  async updateWSOLAccount(action) {
    const preIxs = [];
    const postIxs = [];
    let safeRepay = new bn_js_1.default(this.amount);
    if (
      this.obligationAccountInfo &&
      action === "repay" &&
      this.amount.eq(new bn_js_1.default(constants_2.U64_MAX))
    ) {
      const buffer = await this.connection.getAccountInfo(
        new web3_js_1.PublicKey(this.reserve.address),
        "processed"
      );
      if (!buffer) {
        throw Error(`Unable to fetch reserve data for ${this.reserve.address}`);
      }
      const parsedData = (0, reserve_1.parseReserve)(
        new web3_js_1.PublicKey(this.reserve.address),
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
      safeRepay = new bn_js_1.default(
        Math.floor(
          new bignumber_js_1.default(borrow.borrowedAmountWads.toString())
            .multipliedBy(
              parsedData.liquidity.cumulativeBorrowRateWads.toString()
            )
            .dividedBy(borrow.cumulativeBorrowRateWads.toString())
            .dividedBy(constants_2.WAD)
            .plus(SOL_PADDING_FOR_INTEREST)
            .toNumber()
        ).toString()
      );
    }
    const userWSOLAccountInfo = await this.connection.getAccountInfo(
      this.userTokenAccountAddress
    );
    const rentExempt = await (0,
    spl_token_1.getMinimumBalanceForRentExemptAccount)(this.connection);
    const sendAction =
      action === "deposit" || action === "repay" || action === "mint";
    const transferLamportsIx = web3_js_1.SystemProgram.transfer({
      fromPubkey: this.publicKey,
      toPubkey: this.userTokenAccountAddress,
      lamports:
        (userWSOLAccountInfo ? 0 : rentExempt) +
        (sendAction ? parseInt(safeRepay.toString(), 10) : 0),
    });
    preIxs.push(transferLamportsIx);
    const closeWSOLAccountIx = (0, spl_token_1.createCloseAccountInstruction)(
      this.userTokenAccountAddress,
      this.publicKey,
      this.publicKey,
      []
    );
    if (userWSOLAccountInfo) {
      const syncIx = (0, instructions_1.syncNative)(
        this.userTokenAccountAddress
      );
      if (sendAction) {
        preIxs.push(syncIx);
      } else {
        postIxs.push(closeWSOLAccountIx);
      }
    } else {
      const createUserWSOLAccountIx = (0,
      spl_token_1.createAssociatedTokenAccountInstruction)(
        this.publicKey,
        this.userTokenAccountAddress,
        this.publicKey,
        spl_token_1.NATIVE_MINT
      );
      preIxs.push(createUserWSOLAccountIx);
      postIxs.push(closeWSOLAccountIx);
    }
    if (this.positions && this.positions >= constants_1.POSITION_LIMIT) {
      this.preTxnIxs.push(...preIxs);
      this.postTxnIxs.push(...postIxs);
    } else {
      this.setupIxs.push(...preIxs);
      this.cleanupIxs.push(...postIxs);
    }
  }
}
exports.SolendActionCore = SolendActionCore;
