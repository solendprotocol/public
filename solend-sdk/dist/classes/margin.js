"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const pubkey_1 = require("@project-serum/anchor/dist/cjs/utils/pubkey");
const constants_1 = require("./constants");
const instructions_1 = require("../instructions");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const bn_js_1 = __importDefault(require("bn.js"));
function dustAmountThreshold(decimals) {
  const dustDecimal = new bignumber_js_1.default(decimals / 2).integerValue(
    bignumber_js_1.default.ROUND_FLOOR
  );
  return new bignumber_js_1.default(1).multipliedBy(
    new bignumber_js_1.default(10).pow(dustDecimal)
  );
}
class Margin {
  connection;
  obligation;
  owner;
  obligationAddress;
  longReserve;
  shortReserve;
  pool;
  longReserveLiquidityAta;
  longReserveCollateralAta;
  shortReserveLiquidityAta;
  shortReserveCollateralAta;
  obligationSeed;
  lendingMarketAuthority;
  constructor(
    connection,
    owner,
    longReserve,
    shortReserve,
    pool,
    obligationAddress,
    obligationSeed,
    obligation
  ) {
    this.connection = connection;
    this.obligation = obligation;
    this.owner = owner;
    this.longReserve = longReserve;
    this.shortReserve = shortReserve;
    this.obligationAddress = obligationAddress;
    this.obligationSeed = obligationSeed;
    this.pool = pool;
    this.longReserveLiquidityAta = (0,
    spl_token_1.getAssociatedTokenAddressSync)(
      new web3_js_1.PublicKey(this.longReserve.mintAddress),
      this.owner
    );
    this.longReserveCollateralAta = (0,
    spl_token_1.getAssociatedTokenAddressSync)(
      new web3_js_1.PublicKey(this.longReserve.mintAddress),
      this.owner
    );
    this.shortReserveLiquidityAta = (0,
    spl_token_1.getAssociatedTokenAddressSync)(
      new web3_js_1.PublicKey(this.shortReserve.mintAddress),
      this.owner
    );
    this.shortReserveCollateralAta = (0,
    spl_token_1.getAssociatedTokenAddressSync)(
      new web3_js_1.PublicKey(this.shortReserve.mintAddress),
      this.owner
    );
    const [lendingMarketAuthority, _] = (0, pubkey_1.findProgramAddressSync)(
      [new web3_js_1.PublicKey(this.pool.address).toBytes()],
      new web3_js_1.PublicKey(constants_1.SOLEND_PRODUCTION_PROGRAM_ID)
    );
    this.lendingMarketAuthority = lendingMarketAuthority;
  }
  setupTx = async () => {
    const ixs = [];
    if (!this.obligation) {
      ixs.push(
        web3_js_1.SystemProgram.createAccountWithSeed({
          fromPubkey: this.owner,
          newAccountPubkey: this.obligationAddress,
          basePubkey: this.owner,
          seed: this.obligationSeed,
          lamports: await this.connection.getMinimumBalanceForRentExemption(
            1300
          ),
          space: 1300,
          programId: constants_1.SOLEND_PRODUCTION_PROGRAM_ID,
        })
      );
      ixs.push(
        (0, instructions_1.initObligationInstruction)(
          this.obligationAddress,
          new web3_js_1.PublicKey(this.pool.address),
          this.owner,
          constants_1.SOLEND_PRODUCTION_PROGRAM_ID
        )
      );
    }
    await Promise.all(
      [
        new web3_js_1.PublicKey(this.longReserve.mintAddress),
        new web3_js_1.PublicKey(this.shortReserve.mintAddress),
        new web3_js_1.PublicKey(this.longReserve.cTokenLiquidityAddress),
        new web3_js_1.PublicKey(this.shortReserve.cTokenLiquidityAddress),
      ].map(async (mint) => {
        const tokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(
          mint,
          this.owner,
          true
        );
        if (!(await this.connection.getAccountInfo(tokenAccount))) {
          ixs.push(
            (0, spl_token_1.createAssociatedTokenAccountInstruction)(
              this.owner,
              tokenAccount,
              this.owner,
              mint
            )
          );
        }
      })
    );
    const blockhash = await this.connection
      .getLatestBlockhash()
      .then((res) => res.blockhash);
    const messageV0 = new web3_js_1.TransactionMessage({
      payerKey: this.owner,
      recentBlockhash: blockhash,
      instructions: ixs,
    }).compileToV0Message();
    const tx = new web3_js_1.VersionedTransaction(messageV0);
    return {
      tx,
      obligationAddress: this.obligationAddress,
    };
  };
  getSolendAccountCount = () => {
    const depositKeys =
      this.obligation && this.obligation.deposits.length > 0
        ? this.obligation.deposits.map(
            (ol) => new web3_js_1.PublicKey(ol.reserveAddress)
          )
        : [];
    const borrowKeys =
      this.obligation && this.obligation.borrows.length > 0
        ? this.obligation.borrows.map(
            (ol) => new web3_js_1.PublicKey(ol.reserveAddress)
          )
        : [];
    const ixs = [];
    ixs.push(
      (0, instructions_1.flashBorrowReserveLiquidityInstruction)(
        0,
        new web3_js_1.PublicKey(this.shortReserve.liquidityAddress),
        new web3_js_1.PublicKey(this.shortReserveLiquidityAta),
        new web3_js_1.PublicKey(this.shortReserve.address),
        new web3_js_1.PublicKey(this.pool.address),
        new web3_js_1.PublicKey(constants_1.SOLEND_PRODUCTION_PROGRAM_ID)
      )
    );
    ixs.push(
      (0, instructions_1.repayObligationLiquidityInstruction)(
        0,
        new web3_js_1.PublicKey(this.longReserveLiquidityAta),
        new web3_js_1.PublicKey(this.longReserve.liquidityAddress),
        new web3_js_1.PublicKey(this.longReserve.address),
        new web3_js_1.PublicKey(this.obligationAddress),
        new web3_js_1.PublicKey(this.pool.address),
        this.owner,
        new web3_js_1.PublicKey(constants_1.SOLEND_PRODUCTION_PROGRAM_ID)
      )
    );
    // add newly deposited long reserve from step 4 if not already in deposits
    if (!depositKeys.find((k) => k.toString() === this.longReserve.address)) {
      depositKeys.push(new web3_js_1.PublicKey(this.longReserve.address));
    }
    ixs.push(
      (0,
      instructions_1.depositReserveLiquidityAndObligationCollateralInstruction)(
        0,
        new web3_js_1.PublicKey(this.longReserveLiquidityAta),
        new web3_js_1.PublicKey(this.longReserveCollateralAta),
        new web3_js_1.PublicKey(this.longReserve.address),
        new web3_js_1.PublicKey(this.longReserve.liquidityAddress),
        new web3_js_1.PublicKey(this.longReserve.mintAddress),
        new web3_js_1.PublicKey(this.pool.address),
        this.lendingMarketAuthority,
        new web3_js_1.PublicKey(this.longReserve.cTokenLiquidityAddress),
        new web3_js_1.PublicKey(this.obligationAddress),
        this.owner,
        new web3_js_1.PublicKey(this.longReserve.pythOracle),
        new web3_js_1.PublicKey(this.longReserve.switchboardOracle),
        this.owner,
        new web3_js_1.PublicKey(constants_1.SOLEND_PRODUCTION_PROGRAM_ID)
      )
    );
    // 5) withdraw prev available short token to repay flash loan
    depositKeys.concat(borrowKeys).forEach((k) => {
      const reserve = this.pool.reserves.find(
        (r) => r.address === k.toString()
      );
      if (!reserve) {
        throw new Error(`Failed to find reserve for address: ${k.toString()}`);
      }
      ixs.push(
        (0, instructions_1.refreshReserveInstruction)(
          new web3_js_1.PublicKey(reserve.address),
          new web3_js_1.PublicKey(reserve.pythOracle),
          new web3_js_1.PublicKey(reserve.switchboardOracle)
        )
      );
    });
    ixs.push(
      (0, instructions_1.refreshObligationInstruction)(
        new web3_js_1.PublicKey(this.obligationAddress),
        depositKeys,
        borrowKeys,
        constants_1.SOLEND_PRODUCTION_PROGRAM_ID
      )
    );
    ixs.push(
      (0, instructions_1.withdrawObligationCollateralAndRedeemReserveLiquidity)(
        0,
        new web3_js_1.PublicKey(this.shortReserve.cTokenLiquidityAddress),
        new web3_js_1.PublicKey(this.shortReserveCollateralAta),
        new web3_js_1.PublicKey(this.shortReserve.address),
        new web3_js_1.PublicKey(this.obligationAddress),
        new web3_js_1.PublicKey(this.pool.address),
        this.lendingMarketAuthority,
        new web3_js_1.PublicKey(this.shortReserveLiquidityAta),
        new web3_js_1.PublicKey(this.shortReserve.cTokenLiquidityAddress),
        new web3_js_1.PublicKey(this.shortReserve.liquidityAddress),
        new web3_js_1.PublicKey(this.owner),
        new web3_js_1.PublicKey(this.owner),
        constants_1.SOLEND_PRODUCTION_PROGRAM_ID
      )
    );
    // 6) borrow short token amount to repay flash loan if necessary
    const allKeys = depositKeys.concat(borrowKeys);
    // add new borrow key if user wasn't already borrowing from this reserve
    if (
      !borrowKeys.find(
        (b) => b.toString() === this.shortReserve.address.toString()
      )
    ) {
      allKeys.push(new web3_js_1.PublicKey(this.shortReserve.address));
    }
    allKeys.forEach((k) => {
      const reserve = this.pool.reserves.find(
        (r) => r.address === k.toString()
      );
      if (!reserve) {
        throw new Error(`Failed to find reserve for address: ${k.toString()}`);
      }
      ixs.push(
        (0, instructions_1.refreshReserveInstruction)(
          new web3_js_1.PublicKey(reserve.address),
          new web3_js_1.PublicKey(reserve.pythOracle),
          new web3_js_1.PublicKey(reserve.switchboardOracle)
        )
      );
    });
    ixs.push(
      (0, instructions_1.refreshObligationInstruction)(
        new web3_js_1.PublicKey(this.obligationAddress),
        depositKeys,
        borrowKeys,
        constants_1.SOLEND_PRODUCTION_PROGRAM_ID
      )
    );
    ixs.push(
      (0, instructions_1.borrowObligationLiquidityInstruction)(
        0,
        new web3_js_1.PublicKey(this.shortReserve.liquidityAddress),
        new web3_js_1.PublicKey(this.shortReserveLiquidityAta),
        new web3_js_1.PublicKey(this.shortReserve.address),
        new web3_js_1.PublicKey(this.shortReserve.feeReceiverAddress) ??
          constants_1.NULL_ORACLE,
        new web3_js_1.PublicKey(this.obligationAddress),
        new web3_js_1.PublicKey(this.pool.address),
        this.lendingMarketAuthority,
        this.owner,
        constants_1.SOLEND_PRODUCTION_PROGRAM_ID
      )
    );
    // 7) repay flash loan
    ixs.push(
      (0, instructions_1.flashRepayReserveLiquidityInstruction)(
        0,
        0,
        new web3_js_1.PublicKey(this.shortReserveLiquidityAta),
        new web3_js_1.PublicKey(this.shortReserve.liquidityAddress),
        new web3_js_1.PublicKey(this.shortReserve.feeReceiverAddress) ??
          constants_1.NULL_ORACLE,
        new web3_js_1.PublicKey(this.shortReserve.feeReceiverAddress) ??
          constants_1.NULL_ORACLE,
        new web3_js_1.PublicKey(this.shortReserve.address),
        new web3_js_1.PublicKey(this.pool.address),
        this.owner,
        constants_1.SOLEND_PRODUCTION_PROGRAM_ID
      )
    );
    const txn = new web3_js_1.TransactionMessage({
      payerKey: this.owner,
      recentBlockhash: "",
      instructions: ixs,
    }).compileToLegacyMessage();
    return txn.accountKeys.length;
  };
  leverTx = async (
    swapBaseAmount,
    route,
    swapInstructions,
    lookupTableAccounts
  ) => {
    const swapBaseBigNumber = new bignumber_js_1.default(
      swapBaseAmount.toString()
    );
    if (!this.obligation) {
      throw Error("Obligation not initialized");
    }
    const fee = swapBaseBigNumber
      .multipliedBy(
        new bignumber_js_1.default(this.shortReserve.flashLoanFee).toString()
      )
      .integerValue(bignumber_js_1.default.ROUND_CEIL);
    let depositKeys =
      this.obligation && this.obligation.deposits.length > 0
        ? this.obligation.deposits.map(
            (ol) => new web3_js_1.PublicKey(ol.reserveAddress)
          )
        : [];
    let borrowKeys =
      this.obligation && this.obligation.borrows.length > 0
        ? this.obligation.borrows.map(
            (ol) => new web3_js_1.PublicKey(ol.reserveAddress)
          )
        : [];
    let finalAddressLookupTableAccounts = [];
    // High level:
    // 1) flash borrow short token
    // 2) swap short -> long
    // 3) repay prev long borrows if any
    // 4) deposit remaining long after repay
    // 5) withdraw prev short if any
    // 6) borrow remaining short needed to repay flash loan
    // 7) repay flash borrow
    const ixs = [];
    ixs.push(
      (0, instructions_1.flashBorrowReserveLiquidityInstruction)(
        swapBaseAmount,
        new web3_js_1.PublicKey(this.shortReserve.liquidityAddress),
        new web3_js_1.PublicKey(this.shortReserveLiquidityAta),
        new web3_js_1.PublicKey(this.shortReserve.address),
        new web3_js_1.PublicKey(this.pool.address),
        new web3_js_1.PublicKey(constants_1.SOLEND_PRODUCTION_PROGRAM_ID)
      )
    );
    swapInstructions.forEach((ix) => ixs.push(ix));
    finalAddressLookupTableAccounts = [...lookupTableAccounts];
    const longBalancePostSlippage = new bignumber_js_1.default(
      route.outAmount.toString()
    )
      .multipliedBy(1 - route.slippageBps / 10000)
      .integerValue(bignumber_js_1.default.ROUND_FLOOR);
    // 3) repay any prev long borrows
    const prevLongBorrowAmount =
      this.obligation.borrows
        .find((b) => b.reserveAddress === this.longReserve.address)
        ?.amount?.shiftedBy(this.longReserve.decimals)
        .toString() ?? "0";
    const maxLongRepayAmount = bignumber_js_1.default.min(
      prevLongBorrowAmount,
      longBalancePostSlippage
    );
    const longBalancePostRepay =
      longBalancePostSlippage.minus(maxLongRepayAmount);
    if (!maxLongRepayAmount.isZero()) {
      // non-zero deposit amount post repay means we need to max repay
      let repayAmount;
      if (longBalancePostRepay.isZero()) {
        repayAmount = new bn_js_1.default(maxLongRepayAmount.toString());
      } else {
        repayAmount = new bn_js_1.default(constants_1.U64_MAX);
        borrowKeys = borrowKeys.filter(
          (k) => k.toString() !== this.longReserve.address
        );
      }
      ixs.push(
        (0, instructions_1.repayObligationLiquidityInstruction)(
          repayAmount,
          new web3_js_1.PublicKey(this.longReserveLiquidityAta),
          new web3_js_1.PublicKey(this.longReserve.liquidityAddress),
          new web3_js_1.PublicKey(this.longReserve.address),
          new web3_js_1.PublicKey(this.obligationAddress),
          new web3_js_1.PublicKey(this.pool.address),
          this.owner,
          new web3_js_1.PublicKey(constants_1.SOLEND_PRODUCTION_PROGRAM_ID)
        )
      );
    }
    // 4) deposit remaining long balance
    if (!longBalancePostRepay.isZero()) {
      // add newly deposited long reserve from step 4 if not already in deposits
      if (!depositKeys.find((k) => k.toString() === this.longReserve.address)) {
        depositKeys.push(new web3_js_1.PublicKey(this.longReserve.address));
      }
      ixs.push(
        (0,
        instructions_1.depositReserveLiquidityAndObligationCollateralInstruction)(
          new bn_js_1.default(longBalancePostRepay.toString()),
          new web3_js_1.PublicKey(this.longReserveLiquidityAta),
          new web3_js_1.PublicKey(this.longReserveCollateralAta),
          new web3_js_1.PublicKey(this.longReserve.address),
          new web3_js_1.PublicKey(this.longReserve.liquidityAddress),
          new web3_js_1.PublicKey(this.longReserve.mintAddress),
          new web3_js_1.PublicKey(this.pool.address),
          this.lendingMarketAuthority,
          new web3_js_1.PublicKey(this.longReserve.cTokenLiquidityAddress),
          new web3_js_1.PublicKey(this.obligationAddress),
          this.owner,
          new web3_js_1.PublicKey(this.longReserve.pythOracle),
          new web3_js_1.PublicKey(this.longReserve.switchboardOracle),
          this.owner,
          new web3_js_1.PublicKey(constants_1.SOLEND_PRODUCTION_PROGRAM_ID)
        )
      );
    }
    // 5) withdraw prev available short token to repay flash loan
    const flashLoanAmountWithFee = swapBaseBigNumber.plus(fee);
    const prevShortSupplyAmount =
      this.obligation.deposits
        .find((b) => b.reserveAddress === this.shortReserve.address)
        ?.amount?.shiftedBy(this.shortReserve.decimals) ??
      new bignumber_js_1.default("0");
    const shortWithdrawAmount = bignumber_js_1.default.min(
      flashLoanAmountWithFee,
      prevShortSupplyAmount
    );
    const shortBorrowAmountPostWithdrawal =
      flashLoanAmountWithFee.minus(shortWithdrawAmount);
    if (!shortWithdrawAmount.isZero()) {
      depositKeys.concat(borrowKeys).forEach((k) => {
        const reserve = this.pool.reserves.find(
          (r) => r.address === k.toString()
        );
        if (!reserve) {
          throw new Error(
            `Failed to find reserve for address: ${k.toString()}`
          );
        }
        ixs.push(
          (0, instructions_1.refreshReserveInstruction)(
            new web3_js_1.PublicKey(reserve.address),
            new web3_js_1.PublicKey(reserve.pythOracle),
            new web3_js_1.PublicKey(reserve.switchboardOracle)
          )
        );
      });
      ixs.push(
        (0, instructions_1.refreshObligationInstruction)(
          new web3_js_1.PublicKey(this.obligationAddress),
          depositKeys,
          borrowKeys,
          constants_1.SOLEND_PRODUCTION_PROGRAM_ID
        )
      );
      const shortSupplyAmountPostWithdrawal =
        prevShortSupplyAmount.minus(shortWithdrawAmount);
      const shortTokenDustThreshold = dustAmountThreshold(
        this.shortReserve.decimals
      );
      const hasSignificantShortSupplyAmountPostWithdrawal =
        shortSupplyAmountPostWithdrawal.isGreaterThan(shortTokenDustThreshold);
      // Zero borrow amount post withdrawal means we have sufficient deposit to repay the flash loan.
      // If post withdrawal amount is insignificant, we can just withdraw everything.
      let withdrawCtokens;
      if (
        shortBorrowAmountPostWithdrawal.isZero() &&
        hasSignificantShortSupplyAmountPostWithdrawal
      ) {
        withdrawCtokens = new bn_js_1.default(
          shortWithdrawAmount
            .dividedBy(
              new bignumber_js_1.default(this.shortReserve.cTokenExchangeRate)
            )
            .integerValue(bignumber_js_1.default.ROUND_FLOOR)
            .toString()
        );
      } else {
        withdrawCtokens = new bn_js_1.default(constants_1.U64_MAX);
        depositKeys = depositKeys.filter(
          (k) => k.toString() !== this.shortReserve.address
        );
      }
      ixs.push(
        (0,
        instructions_1.withdrawObligationCollateralAndRedeemReserveLiquidity)(
          withdrawCtokens,
          new web3_js_1.PublicKey(this.shortReserve.cTokenLiquidityAddress),
          new web3_js_1.PublicKey(this.shortReserveCollateralAta),
          new web3_js_1.PublicKey(this.shortReserve.address),
          new web3_js_1.PublicKey(this.obligationAddress),
          new web3_js_1.PublicKey(this.pool.address),
          this.lendingMarketAuthority,
          new web3_js_1.PublicKey(this.shortReserveLiquidityAta),
          new web3_js_1.PublicKey(this.shortReserve.cTokenLiquidityAddress),
          new web3_js_1.PublicKey(this.shortReserve.liquidityAddress),
          new web3_js_1.PublicKey(this.owner),
          new web3_js_1.PublicKey(this.owner),
          constants_1.SOLEND_PRODUCTION_PROGRAM_ID
        )
      );
    }
    console.log(
      "borrow short token amount needed after withdrawwal: ",
      shortBorrowAmountPostWithdrawal.toString()
    );
    // 6) borrow short token amount to repay flash loan if necessary
    if (!shortBorrowAmountPostWithdrawal.isZero()) {
      const allKeys = depositKeys.concat(borrowKeys);
      // add new borrow key if user wasn't already borrowing from this reserve
      if (
        !borrowKeys.find(
          (b) => b.toString() === this.shortReserve.address.toString()
        )
      ) {
        allKeys.push(new web3_js_1.PublicKey(this.shortReserve.address));
      }
      allKeys.forEach((k) => {
        const reserve = this.pool.reserves.find(
          (r) => r.address === k.toString()
        );
        if (!reserve) {
          throw new Error(
            `Failed to find reserve for address: ${k.toString()}`
          );
        }
        ixs.push(
          (0, instructions_1.refreshReserveInstruction)(
            new web3_js_1.PublicKey(reserve.address),
            new web3_js_1.PublicKey(reserve.pythOracle),
            new web3_js_1.PublicKey(reserve.switchboardOracle)
          )
        );
      });
      ixs.push(
        (0, instructions_1.refreshObligationInstruction)(
          new web3_js_1.PublicKey(this.obligationAddress),
          depositKeys,
          borrowKeys,
          constants_1.SOLEND_PRODUCTION_PROGRAM_ID
        )
      );
      ixs.push(
        (0, instructions_1.borrowObligationLiquidityInstruction)(
          new bn_js_1.default(shortBorrowAmountPostWithdrawal.toString()),
          new web3_js_1.PublicKey(this.shortReserve.liquidityAddress),
          new web3_js_1.PublicKey(this.shortReserveLiquidityAta),
          new web3_js_1.PublicKey(this.shortReserve.address),
          new web3_js_1.PublicKey(this.shortReserve.feeReceiverAddress) ??
            constants_1.NULL_ORACLE,
          new web3_js_1.PublicKey(this.obligationAddress),
          new web3_js_1.PublicKey(this.pool.address),
          this.lendingMarketAuthority,
          this.owner,
          constants_1.SOLEND_PRODUCTION_PROGRAM_ID
        )
      );
    }
    // 7) repay flash loan
    ixs.push(
      (0, instructions_1.flashRepayReserveLiquidityInstruction)(
        new bn_js_1.default(swapBaseAmount),
        0,
        new web3_js_1.PublicKey(this.shortReserveLiquidityAta),
        new web3_js_1.PublicKey(this.shortReserve.liquidityAddress),
        new web3_js_1.PublicKey(this.shortReserve.feeReceiverAddress) ??
          constants_1.NULL_ORACLE,
        new web3_js_1.PublicKey(this.shortReserve.feeReceiverAddress) ??
          constants_1.NULL_ORACLE,
        new web3_js_1.PublicKey(this.shortReserve.address),
        new web3_js_1.PublicKey(this.pool.address),
        this.owner,
        constants_1.SOLEND_PRODUCTION_PROGRAM_ID
      )
    );
    const blockhash = await this.connection
      .getLatestBlockhash()
      .then((res) => res.blockhash);
    const messageV0 = new web3_js_1.TransactionMessage({
      payerKey: this.owner,
      recentBlockhash: blockhash,
      instructions: ixs,
    }).compileToV0Message(finalAddressLookupTableAccounts);
    return new web3_js_1.VersionedTransaction(messageV0);
  };
}
exports.default = Margin;
