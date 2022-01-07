import {
  AccountInfo,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  Token,
} from "@solana/spl-token";
import { OBLIGATION_SIZE, parseObligation } from "../state/obligation";
import { Asset, Reserve, Market, Config, OracleAsset } from "./types";
import BN from "bn.js";
import {
  depositReserveLiquidityAndObligationCollateralInstruction,
  repayObligationLiquidityInstruction,
  withdrawObligationCollateralAndRedeemReserveLiquidity,
  refreshReserveInstruction,
  initObligationInstruction,
  borrowObligationLiquidityInstruction,
  refreshObligationInstruction,
  syncNative,
} from "../instructions";

export const POSITION_LIMIT = 6;
const API_ENDPOINT = "https://api.solend.fi";

function getTokenInfo(symbol: string, solendInfo: Config) {
  const tokenInfo = solendInfo.assets.find((asset) => asset.symbol === symbol);
  if (!tokenInfo) {
    throw new Error(`Could not find ${symbol} in ASSETS`);
  }
  return tokenInfo;
}

export class SolendAction {
  solendInfo: Config;

  connection: Connection;

  oracleInfo: OracleAsset;

  reserve: Reserve;

  lendingMarket: Market;

  tokenInfo: Asset;

  publicKey: PublicKey;

  obligationAddress: PublicKey;

  obligationAccountInfo: AccountInfo<Buffer> | null;

  userTokenAccountAddress: PublicKey;

  userCollateralAccountAddress: PublicKey;

  seed: string;

  symbol: string;

  positions?: number;

  amount: string;

  hostAta?: PublicKey;

  setupIxs: Array<TransactionInstruction>;

  lendingIxs: Array<TransactionInstruction>;

  cleanupIxs: Array<TransactionInstruction>;

  preTxnIxs: Array<TransactionInstruction>;

  postTxnIxs: Array<TransactionInstruction>;

  private constructor(
    solendInfo: Config,
    connection: Connection,
    reserve: Reserve,
    lendingMarket: Market,
    tokenInfo: Asset,
    publicKey: PublicKey,
    obligationAddress: PublicKey,
    obligationAccountInfo: AccountInfo<Buffer> | null,
    userTokenAccountAddress: PublicKey,
    userCollateralAccountAddress: PublicKey,
    seed: string,
    symbol: string,
    positions: number,
    amount: string,
    hostAta?: PublicKey
  ) {
    this.solendInfo = solendInfo;
    this.connection = connection;
    this.publicKey = publicKey;
    this.amount = amount;
    this.symbol = symbol;
    this.positions = positions;
    this.hostAta = hostAta;
    this.obligationAccountInfo = obligationAccountInfo;
    this.lendingMarket = lendingMarket;
    this.seed = seed;
    this.reserve = reserve;
    const oracleInfo = solendInfo.oracles.assets.find(
      (oracle) => oracle.asset === symbol
    );
    if (!oracleInfo) {
      throw new Error(`Could not find oracleInfo for ${symbol} in reserves`);
    }
    this.oracleInfo = oracleInfo;
    this.tokenInfo = tokenInfo;
    this.obligationAddress = obligationAddress;
    this.userTokenAccountAddress = userTokenAccountAddress;
    this.userCollateralAccountAddress = userCollateralAccountAddress;
    this.setupIxs = [];
    this.lendingIxs = [];
    this.cleanupIxs = [];
    this.preTxnIxs = [];
    this.postTxnIxs = [];
  }

  static async initialize(
    amount: string,
    symbol: string,
    publicKey: PublicKey,
    connection: Connection,
    environment: string = "production",
    hostAta?: PublicKey
  ) {
    const solendInfo = (await (
      await fetch(`${API_ENDPOINT}/v1/config?deployment=${environment}`)
    ).json()) as Config;

    const lendingMarket = solendInfo.markets.find(
      (market) => market.name === "main"
    );

    if (!lendingMarket) {
      throw new Error("Could not find main lending market");
    }

    const seed = lendingMarket.address.slice(0, 32);

    const obligationAddress = await PublicKey.createWithSeed(
      publicKey,
      seed,
      new PublicKey(solendInfo.programID)
    );

    const reserve = lendingMarket.reserves.find((res) => res.asset === symbol);
    if (!reserve) {
      throw new Error(`Could not find asset ${symbol} in reserves`);
    }

    const obligationAccountInfo = await connection.getAccountInfo(
      obligationAddress
    );

    let positions = 0;
    if (obligationAccountInfo) {
      const obligationDetails = parseObligation(
        PublicKey.default,
        obligationAccountInfo!
      )!.info;

      obligationDetails.deposits.forEach((deposit) => {
        positions! += Number(deposit.depositedAmount.toString() !== "0");
      });

      obligationDetails.borrows.forEach((borrow) => {
        positions! += Number(borrow.borrowedAmountWads.toString() !== "0");
      });
    }

    const tokenInfo = getTokenInfo(symbol, solendInfo);
    const userTokenAccountAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      new PublicKey(tokenInfo.mintAddress),
      publicKey
    );
    const userCollateralAccountAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      new PublicKey(reserve.collateralMintAddress),
      publicKey
    );

    return new SolendAction(
      solendInfo,
      connection,
      reserve,
      lendingMarket,
      tokenInfo,
      publicKey,
      obligationAddress,
      obligationAccountInfo,
      userTokenAccountAddress,
      userCollateralAccountAddress,
      seed,
      symbol,
      positions,
      amount,
      hostAta
    );
  }

  static async buildDepositTxns(
    connection: Connection,
    amount: string,
    symbol: string,
    publicKey: PublicKey,
    environment: string = "production"
  ) {
    const axn = await SolendAction.initialize(
      amount,
      symbol,
      publicKey,
      connection,
      environment
    );

    await axn.addSupportIxs("deposit");
    await axn.addDepositIx();

    return axn;
  }

  static async buildBorrowTxns(
    connection: Connection,
    amount: string,
    symbol: string,
    publicKey: PublicKey,
    environment: string = "production",
    hostAta?: PublicKey
  ) {
    const axn = await SolendAction.initialize(
      amount,
      symbol,
      publicKey,
      connection,
      environment,
      hostAta
    );

    await axn.addSupportIxs("borrow");
    await axn.addBorrowIx();

    return axn;
  }

  static async buildWithdrawTxns(
    connection: Connection,
    amount: string,
    symbol: string,
    publicKey: PublicKey,
    environment: string = "production"
  ) {
    const axn = await SolendAction.initialize(
      amount,
      symbol,
      publicKey,
      connection,
      environment
    );

    axn.addSupportIxs("withdraw");
    axn.addWithdrawIx();

    return axn;
  }

  static async buildRepayTxns(
    connection: Connection,
    amount: string,
    symbol: string,
    publicKey: PublicKey,
    environment: string = "production"
  ) {
    const axn = await SolendAction.initialize(
      amount,
      symbol,
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
        new BN(this.amount),
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
        new PublicKey(this.oracleInfo.priceAddress),
        new PublicKey(this.oracleInfo.switchboardFeedAddress),
        this.publicKey, // transferAuthority
        new PublicKey(this.solendInfo.programID)
      )
    );
  }

  addBorrowIx() {
    this.lendingIxs.push(
      borrowObligationLiquidityInstruction(
        new BN(this.amount),
        new PublicKey(this.reserve.liquidityAddress),
        this.userTokenAccountAddress,
        new PublicKey(this.reserve.address),
        new PublicKey(this.reserve.liquidityFeeReceiverAddress),
        this.obligationAddress,
        new PublicKey(this.lendingMarket.address), // lendingMarket
        new PublicKey(this.lendingMarket.authorityAddress), // lendingMarketAuthority
        this.publicKey,
        new PublicKey(this.solendInfo.programID),
        this.hostAta
      )
    );
  }

  addWithdrawIx() {
    this.lendingIxs.push(
      withdrawObligationCollateralAndRedeemReserveLiquidity(
        new BN(this.amount),
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
        new PublicKey(this.solendInfo.programID)
      )
    );
  }

  addRepayIx() {
    this.lendingIxs.push(
      repayObligationLiquidityInstruction(
        new BN(this.amount),
        this.userTokenAccountAddress,
        new PublicKey(this.reserve.liquidityAddress),
        new PublicKey(this.reserve.address),
        this.obligationAddress,
        new PublicKey(this.lendingMarket.address),
        this.publicKey,
        new PublicKey(this.solendInfo.programID)
      )
    );
  }

  async addSupportIxs(action: "deposit" | "borrow" | "withdraw" | "repay") {
    await this.addRefreshIxs(action === "deposit");
    if (action !== "deposit") {
      await this.addObligationIxs();
    }
    await this.addAtaIxs(action);
  }

  private async addRefreshIxs(isDeposit: boolean) {

    const rawObligationData = await this.connection.getAccountInfo(
      this.obligationAddress
    );
    const obligationDetails = parseObligation(
      PublicKey.default,
      rawObligationData!
    )!.info;
    const depositReserves = obligationDetails.deposits.map(
      (dep) => dep.depositReserve
    );
    const borrowReserves = obligationDetails.borrows.map(
      (bor) => bor.borrowReserve
    );

    // Union of addresses
    const allReserveAddresses = [
      ...new Set([
        ...depositReserves.map((e) => e.toBase58()),
        ...borrowReserves.map((e) => e.toBase58()),
        this.reserve.address,
      ]),
    ];

    if (isDeposit) {
      const refreshReserveIx = refreshReserveInstruction(
        new PublicKey(this.reserve.address),
        new PublicKey(this.oracleInfo.priceAddress),
        new PublicKey(this.oracleInfo.switchboardFeedAddress)
      );
      this.setupIxs.push(refreshReserveIx);
    } else {
      allReserveAddresses.forEach((reserveAddress) => {
        const reserveInfo = this.lendingMarket.reserves.find(
          (reserve) => reserve.address === reserveAddress
        );
        if (!reserveInfo) {
          throw new Error(`Could not find asset ${reserveAddress} in reserves`);
        }
        const oracleInfo = this.solendInfo.oracles.assets.find(
          (asset) => asset.asset === reserveInfo.asset
        );
        if (!oracleInfo) {
          throw new Error(
            `Could not find asset ${reserveInfo.asset} in reserves`
          );
        }
        const refreshReserveIx = refreshReserveInstruction(
          new PublicKey(reserveAddress),
          new PublicKey(oracleInfo.priceAddress),
          new PublicKey(oracleInfo.switchboardFeedAddress)
        );
        this.setupIxs.push(refreshReserveIx);
      });

      const refreshObligationIx = refreshObligationInstruction(
        this.obligationAddress,
        depositReserves,
        borrowReserves,
        new PublicKey(this.solendInfo.programID)
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
          programId: new PublicKey(this.solendInfo.programID),
        })
      );
      const initObligationIx = initObligationInstruction(
        this.obligationAddress,
        new PublicKey(this.lendingMarket.address),
        this.publicKey,
        new PublicKey(this.solendInfo.programID)
      );
      this.setupIxs.push(initObligationIx);
    }
  }

  private async addAtaIxs(action: "deposit" | "borrow" | "withdraw" | "repay") {
    if (this.symbol === "SOL") {
      await this.updateWSOLAccount();
    }

    if (
      (action === "withdraw" || action === "borrow") &&
      this.symbol !== "SOL"
    ) {
      const userTokenAccountInfo = await this.connection.getAccountInfo(
        this.userTokenAccountAddress
      );
      if (!userTokenAccountInfo) {
        const createUserCollateralAccountIx =
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            new PublicKey(this.tokenInfo.mintAddress),
            this.userTokenAccountAddress,
            this.publicKey,
            this.publicKey
          );
        if (this.positions === 6 && this.hostAta) {
          this.setupIxs.push(createUserCollateralAccountIx);
        } else {
          this.preTxnIxs.push(createUserCollateralAccountIx);
        }
      }
    }

    if (action === "deposit") {
      const userCollateralAccountInfo = await this.connection.getAccountInfo(
        this.userCollateralAccountAddress
      );

      if (!userCollateralAccountInfo) {
        const createUserCollateralAccountIx =
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            new PublicKey(this.reserve.collateralMintAddress),
            this.userCollateralAccountAddress,
            this.publicKey,
            this.publicKey
          );
        this.setupIxs.push(createUserCollateralAccountIx);
      }
    }
  }

  private async updateWSOLAccount() {
    const preIxs: Array<TransactionInstruction> = [];
    const postIxs: Array<TransactionInstruction> = [];

    const userWSOLAccountInfo = await this.connection.getAccountInfo(
      this.userTokenAccountAddress
    );

    const rentExempt = await Token.getMinBalanceRentForExemptAccount(
      this.connection
    );

    const transferLamportsIx = SystemProgram.transfer({
      fromPubkey: this.publicKey,
      toPubkey: this.userCollateralAccountAddress,
      lamports:
        (userWSOLAccountInfo ? 0 : rentExempt) + parseInt(this.amount, 10),
    });

    if (userWSOLAccountInfo) {
      preIxs.push(transferLamportsIx);
      preIxs.push(syncNative(this.userTokenAccountAddress));
      return;
    }

    const createUserWSOLAccountIx =
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        NATIVE_MINT,
        this.userTokenAccountAddress,
        this.publicKey,
        this.publicKey
      );
    preIxs.push(createUserWSOLAccountIx);

    const closeWSOLAccountIx = Token.createCloseAccountInstruction(
      TOKEN_PROGRAM_ID,
      this.userTokenAccountAddress,
      this.publicKey,
      this.publicKey,
      []
    );
    postIxs.push(closeWSOLAccountIx);

    if (this.positions === 6) {
      this.preTxnIxs.push(...preIxs);
      this.postTxnIxs.push(...postIxs);
    } else {
      this.setupIxs.push(...preIxs);
      this.cleanupIxs.push(...postIxs);
    }
  }
}
