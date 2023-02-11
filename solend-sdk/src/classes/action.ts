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
import axios from "axios";
import {
  Obligation,
  OBLIGATION_SIZE,
  parseObligation,
} from "../state/obligation";
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
} from "../instructions";
import { U64_MAX, WAD, getProgramId } from "./constants";
import { parseReserve } from "../state/reserve";
import { ReserveConfigType, MarketConfigType, ConfigType } from "./shared";

export const POSITION_LIMIT = 6;

const API_ENDPOINT = "https://api.solend.fi";

const SOL_PADDING_FOR_INTEREST = "1000000";

export type ActionType =
  | "deposit"
  | "borrow"
  | "withdraw"
  | "repay"
  | "mint"
  | "redeem"
  | "depositCollateral";

function getTokenInfo(symbol: string, solendInfo: MarketConfigType) {
  const tokenInfo = solendInfo.reserves.find(
    (reserve) => reserve.liquidityToken.symbol === symbol
  );
  if (!tokenInfo) {
    throw new Error(`Could not find ${symbol} in ASSETS`);
  }
  return tokenInfo;
}

export class SolendAction {
  programId: PublicKey;

  connection: Connection;

  reserve: ReserveConfigType;

  lendingMarket: MarketConfigType;

  publicKey: PublicKey;

  obligationAddress: PublicKey;

  obligationAccountInfo: Obligation | null;

  userTokenAccountAddress: PublicKey;

  userCollateralAccountAddress: PublicKey;

  seed: string;

  symbol: string;

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
    reserve: ReserveConfigType,
    lendingMarket: MarketConfigType,
    publicKey: PublicKey,
    obligationAddress: PublicKey,
    obligationAccountInfo: Obligation | null,
    userTokenAccountAddress: PublicKey,
    userCollateralAccountAddress: PublicKey,
    seed: string,
    symbol: string,
    positions: number,
    amount: string | BN,
    depositReserves: Array<PublicKey>,
    borrowReserves: Array<PublicKey>,
    hostAta?: PublicKey
  ) {
    this.programId = programId;
    this.connection = connection;
    this.publicKey = publicKey;
    this.amount = new BN(amount);
    this.symbol = symbol;
    this.positions = positions;
    this.hostAta = hostAta;
    this.obligationAccountInfo = obligationAccountInfo;
    this.lendingMarket = lendingMarket;
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
    action: ActionType,
    amount: string | BN,
    symbol: string,
    publicKey: PublicKey,
    connection: Connection,
    environment: "production" | "devnet" = "production",
    lendingMarketAddress?: PublicKey,
    hostAta?: PublicKey
  ) {
    const solendInfo = (await (
      await axios.get(
        `${API_ENDPOINT}/v1/markets/configs?scope=all&deployment=${environment}`
      )
    ).data) as ConfigType;

    let lendingMarket: MarketConfigType | undefined;
    if (lendingMarketAddress) {
      lendingMarket = solendInfo.find(
        (market) => market.address == lendingMarketAddress.toBase58()
      );
      if (!lendingMarket) {
        throw `market address not found: ${lendingMarketAddress}`;
      }
    } else {
      lendingMarket =
        solendInfo.find((market) => market.isPrimary) ?? solendInfo[0];
    }

    const seed = lendingMarket.address.slice(0, 32);

    const programId = getProgramId(environment);

    const obligationAddress = await PublicKey.createWithSeed(
      publicKey,
      seed,
      programId
    );

    const reserve = lendingMarket.reserves.find(
      (res) => res.liquidityToken.symbol === symbol
    );
    if (!reserve) {
      throw new Error(`Could not find asset ${symbol} in reserves`);
    }

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
        ...Array.from([
          ...borrowReserves.map((e) => e.toBase58()),
          ...(action === "borrow" ? [reserve.address] : []),
        ]),
      ].length +
      [
        ...Array.from([
          ...depositReserves.map((e) => e.toBase58()),
          ...(action === "deposit" ? [reserve.address] : []),
        ]),
      ].length;

    if (distinctReserveCount > POSITION_LIMIT) {
      throw Error(
        `Obligation already has max number of positions: ${POSITION_LIMIT}`
      );
    }

    const tokenInfo = getTokenInfo(symbol, lendingMarket);
    const userTokenAccountAddress = await getAssociatedTokenAddress(
      new PublicKey(tokenInfo.liquidityToken.mint),
      publicKey,
      true
    );
    const userCollateralAccountAddress = await getAssociatedTokenAddress(
      new PublicKey(reserve.collateralMintAddress),
      publicKey,
      true
    );

    return new SolendAction(
      programId,
      connection,
      reserve,
      lendingMarket,
      publicKey,
      obligationAddress,
      obligationDetails,
      userTokenAccountAddress,
      userCollateralAccountAddress,
      seed,
      symbol,
      distinctReserveCount,
      amount,
      depositReserves,
      borrowReserves,
      hostAta
    );
  }

  static async buildDepositTxns(
    connection: Connection,
    amount: string | BN,
    symbol: string,
    publicKey: PublicKey,
    environment: "production" | "devnet" = "production",
    lendingMarketAddress?: PublicKey
  ) {
    const axn = await SolendAction.initialize(
      "deposit",
      amount,
      symbol,
      publicKey,
      connection,
      environment,
      lendingMarketAddress
    );

    await axn.addSupportIxs("deposit");
    await axn.addDepositIx();

    return axn;
  }

  static async buildBorrowTxns(
    connection: Connection,
    amount: string | BN,
    symbol: string,
    publicKey: PublicKey,
    environment: "production" | "devnet" = "production",
    hostAta?: PublicKey,
    lendingMarketAddress?: PublicKey
  ) {
    const axn = await SolendAction.initialize(
      "borrow",
      amount,
      symbol,
      publicKey,
      connection,
      environment,
      lendingMarketAddress,
      hostAta
    );

    await axn.addSupportIxs("borrow");
    await axn.addBorrowIx();

    return axn;
  }
  static async buildDepositReserveLiquidityTxns(
    connection: Connection,
    amount: string | BN,
    symbol: string,
    publicKey: PublicKey,
    environment: "production" | "devnet" = "production",
    lendingMarketAddress?: PublicKey
  ) {
    const axn = await SolendAction.initialize(
      "mint",
      amount,
      symbol,
      publicKey,
      connection,
      environment,
      lendingMarketAddress
    );
    await axn.addSupportIxs("mint");
    await axn.addDepositReserveLiquidityIx();
    return axn;
  }

  static async buildRedeemReserveCollateralTxns(
    connection: Connection,
    amount: string | BN,
    symbol: string,
    publicKey: PublicKey,
    environment: "production" | "devnet" = "production",
    lendingMarketAddress?: PublicKey
  ) {
    const axn = await SolendAction.initialize(
      "redeem",
      amount,
      symbol,
      publicKey,
      connection,
      environment,
      lendingMarketAddress
    );
    await axn.addSupportIxs("redeem");
    await axn.addRedeemReserveCollateralIx();
    return axn;
  }

  static async buildDepositObligationCollateralTxns(
    connection: Connection,
    amount: string | BN,
    symbol: string,
    publicKey: PublicKey,
    environment: "production" | "devnet" = "production",
    lendingMarketAddress?: PublicKey
  ) {
    const axn = await SolendAction.initialize(
      "depositCollateral",
      amount,
      symbol,
      publicKey,
      connection,
      environment,
      lendingMarketAddress
    );
    await axn.addSupportIxs("depositCollateral");
    await axn.addDepositObligationCollateralIx();
    return axn;
  }

  static async buildWithdrawTxns(
    connection: Connection,
    amount: string | BN,
    symbol: string,
    publicKey: PublicKey,
    environment: "production" | "devnet" = "production",
    lendingMarketAddress?: PublicKey
  ) {
    const axn = await SolendAction.initialize(
      "withdraw",
      amount,
      symbol,
      publicKey,
      connection,
      environment,
      lendingMarketAddress
    );

    await axn.addSupportIxs("withdraw");
    await axn.addWithdrawIx();

    return axn;
  }

  static async buildRepayTxns(
    connection: Connection,
    amount: string | BN,
    symbol: string,
    publicKey: PublicKey,
    environment: "production" | "devnet" = "production",
    lendingMarketAddress?: PublicKey
  ) {
    const axn = await SolendAction.initialize(
      "repay",
      amount,
      symbol,
      publicKey,
      connection,
      environment,
      lendingMarketAddress
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
    ) => Promise<TransactionSignature>
  ) {
    const txns = await this.getTransactions();

    await this.sendSingleTransaction(txns.preLendingTxn, sendTransaction);

    const signature = await this.sendSingleTransaction(
      txns.lendingTxn,
      sendTransaction
    );

    await this.sendSingleTransaction(txns.postLendingTxn, sendTransaction);

    return signature;
  }

  private async sendSingleTransaction(
    txn: Transaction | null,
    sendTransaction: (
      txn: Transaction,
      connection: Connection
    ) => Promise<TransactionSignature>
  ) {
    if (!txn) return "";

    const signature = await sendTransaction(txn, this.connection);
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
        new PublicKey(this.reserve.collateralMintAddress),
        new PublicKey(this.lendingMarket.address),
        new PublicKey(this.lendingMarket.authorityAddress),
        new PublicKey(this.reserve.collateralSupplyAddress), // destinationCollateral
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
        new PublicKey(this.reserve.collateralMintAddress),
        new PublicKey(this.lendingMarket.address),
        new PublicKey(this.lendingMarket.authorityAddress),
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
        new PublicKey(this.reserve.collateralMintAddress),
        new PublicKey(this.reserve.liquidityAddress),
        new PublicKey(this.lendingMarket.address), // lendingMarket
        new PublicKey(this.lendingMarket.authorityAddress), // lendingMarketAuthority
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
        new PublicKey(this.reserve.collateralSupplyAddress),
        new PublicKey(this.reserve.address),
        this.obligationAddress, // obligation
        new PublicKey(this.lendingMarket.address),
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
        new PublicKey(this.lendingMarket.address), // lendingMarket
        new PublicKey(this.lendingMarket.authorityAddress), // lendingMarketAuthority
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
      throw Error(
        `Unable to fetch reserve data for ${this.reserve.liquidityToken.name}`
      );
    }

    const parsedData = parseReserve(
      new PublicKey(this.reserve.address),
      buffer
    )?.info;

    if (!parsedData) {
      throw Error(
        `Unable to parse data of reserve ${this.reserve.liquidityToken.name}`
      );
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
                .integerValue(BigNumber.ROUND_FLOOR)
                .toString()
            ),
        new PublicKey(this.reserve.collateralSupplyAddress),
        this.userCollateralAccountAddress,
        new PublicKey(this.reserve.address),
        this.obligationAddress,
        new PublicKey(this.lendingMarket.address),
        new PublicKey(this.lendingMarket.authorityAddress),
        this.userTokenAccountAddress, // destinationLiquidity
        new PublicKey(this.reserve.collateralMintAddress),
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
        new PublicKey(this.lendingMarket.address),
        this.publicKey,
        this.programId
      )
    );
  }

  async addSupportIxs(action: ActionType) {
    if (["withdraw", "borrow"].includes(action)) {
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
      const reserveInfo = this.lendingMarket.reserves.find(
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
        new PublicKey(this.lendingMarket.address),
        this.publicKey,
        this.programId
      );
      this.setupIxs.push(initObligationIx);
    }
  }

  private async addAtaIxs(action: ActionType) {
    if (this.symbol === "SOL") {
      await this.updateWSOLAccount(action);
    }

    if (
      (action === "withdraw" || action === "borrow" || action === "redeem") &&
      this.symbol !== "SOL"
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
            new PublicKey(this.reserve.liquidityToken.mint),
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
            new PublicKey(this.reserve.collateralMintAddress),
          );

        if (this.positions === POSITION_LIMIT && this.symbol === "SOL") {
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
        throw Error(
          `Unable to fetch reserve data for ${this.reserve.liquidityToken.name}`
        );
      }

      const parsedData = parseReserve(
        new PublicKey(this.reserve.address),
        buffer
      )?.info;

      if (!parsedData) {
        throw Error(
          `Unable to parse data of reserve ${this.reserve.liquidityToken.name}`
        );
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
      const createUserWSOLAccountIx =
        createAssociatedTokenAccountInstruction(
          this.publicKey,
          this.userTokenAccountAddress,
          this.publicKey,
          NATIVE_MINT,
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
