import {
  AddressLookupTableAccount,
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { ObligationType, PoolType, ReserveType } from ".";
import {
  NULL_ORACLE,
  SOLEND_PRODUCTION_PROGRAM_ID,
  U64_MAX,
} from "./constants";
import {
  borrowObligationLiquidityInstruction,
  depositReserveLiquidityAndObligationCollateralInstruction,
  flashBorrowReserveLiquidityInstruction,
  flashRepayReserveLiquidityInstruction,
  initObligationInstruction,
  refreshObligationInstruction,
  refreshReserveInstruction,
  repayObligationLiquidityInstruction,
  withdrawObligationCollateralAndRedeemReserveLiquidity,
} from "../instructions";
import BigNumber from "bignumber.js";
import BN from "bn.js";
import JSBI from "jsbi";
import { SolendActionCore } from "./actions";

function dustAmountThreshold(decimals: number) {
  const dustDecimal = new BigNumber(decimals / 2).integerValue(
    BigNumber.ROUND_FLOOR
  );
  return new BigNumber(1).multipliedBy(new BigNumber(10).pow(dustDecimal));
}

export class Margin {
  connection: Connection;

  obligation?: ObligationType;

  owner: PublicKey;

  obligationAddress: PublicKey;

  longReserve: ReserveType;

  shortReserve: ReserveType;

  pool: PoolType;

  collateralReserve?: ReserveType;

  longReserveLiquidityAta: PublicKey;

  longReserveCollateralAta: PublicKey;

  shortReserveLiquidityAta: PublicKey;

  shortReserveCollateralAta: PublicKey;

  obligationSeed: string;

  lendingMarketAuthority: PublicKey;

  depositKeys: Array<PublicKey>;

  borrowKeys: Array<PublicKey>;

  constructor(
    connection: Connection,
    owner: PublicKey,
    longReserve: ReserveType,
    shortReserve: ReserveType,
    pool: PoolType,
    obligationAddress: PublicKey,
    obligationSeed: string,
    obligation?: ObligationType,
    collateralReserve?: ReserveType
  ) {
    this.connection = connection;
    this.obligation = obligation;
    this.owner = owner;
    this.longReserve = longReserve;
    this.shortReserve = shortReserve;
    this.obligationAddress = obligationAddress;
    this.obligationSeed = obligationSeed;
    this.pool = pool;
    this.collateralReserve = collateralReserve;

    this.longReserveLiquidityAta = getAssociatedTokenAddressSync(
      new PublicKey(this.longReserve.mintAddress),
      this.owner
    );
    this.longReserveCollateralAta = getAssociatedTokenAddressSync(
      new PublicKey(this.longReserve.cTokenMint),
      this.owner
    );

    this.shortReserveLiquidityAta = getAssociatedTokenAddressSync(
      new PublicKey(this.shortReserve.mintAddress),
      this.owner
    );
    this.shortReserveCollateralAta = getAssociatedTokenAddressSync(
      new PublicKey(this.shortReserve.cTokenMint),
      this.owner
    );

    const [lendingMarketAuthority, _] = findProgramAddressSync(
      [new PublicKey(this.pool.address).toBytes()],
      SOLEND_PRODUCTION_PROGRAM_ID
    );

    this.lendingMarketAuthority = lendingMarketAuthority;

    this.depositKeys =
      this.obligation && this.obligation.deposits.length > 0
        ? this.obligation.deposits.map((ol) => new PublicKey(ol.reserveAddress))
        : [];
    this.borrowKeys =
      this.obligation && this.obligation.borrows.length > 0
        ? this.obligation.borrows.map((ol) => new PublicKey(ol.reserveAddress))
        : [];
  }

  calculateMaxUserBorrowPower = () => {
    console.log(
      "minPriceBorrowLimit",
      this.obligation?.minPriceBorrowLimit.toString()
    );
    console.log(this.obligation);
    let curShortSupplyAmount =
      this.obligation?.deposits.find(
        (d) => d.reserveAddress === this.shortReserve.address
      )?.amount ?? new BigNumber(0);
    console.log(
      "short supply",
      curShortSupplyAmount.toString(),
      this.shortReserve.address
    );
    let curShortBorrowAmount =
      this.obligation?.borrows.find(
        (d) => d.reserveAddress === this.shortReserve.address
      )?.amount ?? new BigNumber(0);
    let curLongSupplyAmount =
      this.obligation?.deposits.find(
        (d) => d.reserveAddress === this.longReserve.address
      )?.amount ?? new BigNumber(0);
    let curLongBorrowAmount =
      this.obligation?.borrows.find(
        (d) => d.reserveAddress === this.longReserve.address
      )?.amount ?? new BigNumber(0);
    // handle the case where short token has non-zero ltv / infitie borrow weight e.g mSOL/stSOL
    if (
      this.shortReserve.addedBorrowWeightBPS.toString() === U64_MAX ||
      new BigNumber(this.shortReserve.totalBorrow).isGreaterThanOrEqualTo(
        new BigNumber(this.shortReserve.reserveBorrowCap)
      )
    ) {
      // convert to base and round up to match calculation logic in margin.tsx
      const flashLoanFeeBase = curShortSupplyAmount
        .multipliedBy(new BigNumber(this.shortReserve.flashLoanFee))
        .multipliedBy(new BigNumber(10 ** this.shortReserve.decimals))
        .integerValue(BigNumber.ROUND_CEIL);
      const flashLoanFee = new BigNumber(
        flashLoanFeeBase
          .dividedBy(new BigNumber(10 ** this.shortReserve.decimals))
          .toString()
      );
      const maxPossibleSwap = curShortSupplyAmount.minus(flashLoanFee);

      return maxPossibleSwap.toNumber();
    }

    const shortTokenPrice = this.shortReserve.price;
    const longTokenPrice = this.longReserve.price;

    const shortTokenBorrowWeight = new BigNumber(
      this.shortReserve.addedBorrowWeightBPS.toString()
    )
      .plus(new BigNumber(10000))
      .dividedBy(new BigNumber(10000));
    const longTokenBorrowWeight = new BigNumber(
      this.longReserve.addedBorrowWeightBPS.toString()
    )
      .plus(new BigNumber(10000))
      .dividedBy(new BigNumber(10000));
    let totalShortSwapable = new BigNumber(0);
    let curMinPriceBorrowLimit =
      this.obligation?.minPriceBorrowLimit ?? BigNumber(0);
    let curMaxPriceUserTotalWeightedBorrow =
      this.obligation?.maxPriceUserTotalWeightedBorrow ?? BigNumber(0);

    for (let i = 0; i < 20; i += 1) {
      if (
        curMaxPriceUserTotalWeightedBorrow.isGreaterThanOrEqualTo(
          curMinPriceBorrowLimit
        )
      ) {
        break;
      }
      let swapable = new BigNumber(0);
      const marginAvailible = curMinPriceBorrowLimit.minus(
        curMaxPriceUserTotalWeightedBorrow
      );
      if (curShortSupplyAmount > new BigNumber(0)) {
        // case you still have longs of your short token to sell
        if (this.shortReserve.loanToValueRatio.toString() === "0") {
          swapable = curShortSupplyAmount;
        } else {
          swapable = BigNumber.min(
            marginAvailible
              .dividedBy(shortTokenPrice)
              .dividedBy(new BigNumber(this.shortReserve.loanToValueRatio)),
            curShortSupplyAmount
          );
        }

        curShortSupplyAmount = curShortSupplyAmount.minus(swapable);
        curMinPriceBorrowLimit = curMinPriceBorrowLimit.minus(
          swapable
            .times(shortTokenPrice)
            .times(new BigNumber(this.shortReserve.loanToValueRatio))
        );
      } else {
        // you are already short your short token
        swapable = marginAvailible
          .dividedBy(shortTokenBorrowWeight)
          .dividedBy(shortTokenPrice);
        curShortBorrowAmount = curShortBorrowAmount.plus(swapable);

        curMaxPriceUserTotalWeightedBorrow =
          curMaxPriceUserTotalWeightedBorrow.plus(
            swapable.times(shortTokenPrice).times(shortTokenBorrowWeight)
          );
      }

      totalShortSwapable = totalShortSwapable.plus(swapable);
      const longRecievedInSwap = swapable
        .times(shortTokenPrice)
        .dividedBy(longTokenPrice);

      if (curLongBorrowAmount > longRecievedInSwap) {
        curLongBorrowAmount = curLongBorrowAmount.minus(longRecievedInSwap);
        curMaxPriceUserTotalWeightedBorrow =
          curMaxPriceUserTotalWeightedBorrow.minus(
            longRecievedInSwap
              .times(longTokenPrice)
              .times(longTokenBorrowWeight)
          );
      } else {
        curLongSupplyAmount = curLongSupplyAmount
          .plus(longRecievedInSwap)
          .minus(curLongBorrowAmount);
        curMaxPriceUserTotalWeightedBorrow =
          curMaxPriceUserTotalWeightedBorrow.minus(
            curLongBorrowAmount
              .times(longTokenPrice)
              .times(longTokenBorrowWeight)
          );
        curMinPriceBorrowLimit = curMinPriceBorrowLimit.plus(
          longRecievedInSwap
            .minus(curLongBorrowAmount)
            .times(longTokenPrice)
            .times(new BigNumber(this.longReserve.loanToValueRatio))
        );
        curLongBorrowAmount = new BigNumber(0);
      }
    }

    return totalShortSwapable.times(new BigNumber(".975")).toNumber();
  };

  setupTx = async (depositCollateralConfig?: {
    collateralReserve: ReserveType;
    amount: string;
  }) => {
    const ixs: TransactionInstruction[] = [];
    // If we are depositing, the deposit instruction will handle creating the obligation
    if (
      (!this.obligation || this.obligation.address === "empty") &&
      !depositCollateralConfig
    ) {
      ixs.push(
        SystemProgram.createAccountWithSeed({
          fromPubkey: this.owner,
          newAccountPubkey: this.obligationAddress,
          basePubkey: this.owner,
          seed: this.obligationSeed,
          lamports: await this.connection.getMinimumBalanceForRentExemption(
            1300
          ),
          space: 1300,
          programId: SOLEND_PRODUCTION_PROGRAM_ID,
        })
      );
      ixs.push(
        initObligationInstruction(
          this.obligationAddress,
          new PublicKey(this.pool.address),
          this.owner,
          SOLEND_PRODUCTION_PROGRAM_ID
        )
      );
    }

    await Promise.all(
      [
        new PublicKey(this.longReserve.mintAddress),
        new PublicKey(this.shortReserve.mintAddress),
        new PublicKey(this.longReserve.cTokenMint),
        new PublicKey(this.shortReserve.cTokenMint),
      ].map(async (mint) => {
        const tokenAccount = await getAssociatedTokenAddress(
          mint,
          this.owner,
          true
        );

        if (!(await this.connection.getAccountInfo(tokenAccount))) {
          ixs.push(
            createAssociatedTokenAccountInstruction(
              this.owner,
              tokenAccount,
              this.owner,
              mint
            )
          );
        }
      })
    );

    if (depositCollateralConfig) {
      const solendAction = await SolendActionCore.buildDepositTxns(
        this.pool,
        depositCollateralConfig.collateralReserve,
        this.connection,
        depositCollateralConfig.amount,
        this.owner,
        "production",
        this.obligationAddress,
        this.obligationSeed
      );
      const { preLendingTxn, lendingTxn } =
        await solendAction.getTransactions();
      ixs.push(
        ...(preLendingTxn?.instructions ?? []),
        ...(lendingTxn?.instructions ?? [])
      );

      // add newly deposited long reserve from step 4 if not already in deposits
      if (
        !this.depositKeys.find(
          (k) =>
            k.toString() === depositCollateralConfig.collateralReserve.address
        )
      ) {
        this.depositKeys.push(
          new PublicKey(depositCollateralConfig.collateralReserve.address)
        );
      }
    }

    const blockhash = await this.connection
      .getLatestBlockhash()
      .then((res) => res.blockhash);

    const messageV0 = new TransactionMessage({
      payerKey: this.owner,
      recentBlockhash: blockhash,
      instructions: ixs,
    }).compileToV0Message();

    const tx = new VersionedTransaction(messageV0);

    return {
      tx,
      obligationAddress: this.obligationAddress,
    };
  };

  getSolendAccountCount = () => {
    const depositKeys =
      this.obligation && this.obligation.deposits.length > 0
        ? this.obligation.deposits.map((ol) => new PublicKey(ol.reserveAddress))
        : [];
    const borrowKeys =
      this.obligation && this.obligation.borrows.length > 0
        ? this.obligation.borrows.map((ol) => new PublicKey(ol.reserveAddress))
        : [];

    const ixs: TransactionInstruction[] = [];

    ixs.push(
      flashBorrowReserveLiquidityInstruction(
        0,
        new PublicKey(this.shortReserve.liquidityAddress),
        new PublicKey(this.shortReserveLiquidityAta),
        new PublicKey(this.shortReserve.address),
        new PublicKey(this.pool.address),
        SOLEND_PRODUCTION_PROGRAM_ID
      )
    );

    ixs.push(
      repayObligationLiquidityInstruction(
        0,
        new PublicKey(this.longReserveLiquidityAta),
        new PublicKey(this.longReserve.liquidityAddress),
        new PublicKey(this.longReserve.address),
        new PublicKey(this.obligationAddress),
        new PublicKey(this.pool.address),
        this.owner,
        SOLEND_PRODUCTION_PROGRAM_ID
      )
    );

    // add newly deposited long reserve from step 4 if not already in deposits
    if (!depositKeys.find((k) => k.toString() === this.longReserve.address)) {
      depositKeys.push(new PublicKey(this.longReserve.address));
    }

    ixs.push(
      depositReserveLiquidityAndObligationCollateralInstruction(
        0,
        new PublicKey(this.longReserveLiquidityAta),
        new PublicKey(this.longReserveCollateralAta),
        new PublicKey(this.longReserve.address),
        new PublicKey(this.longReserve.liquidityAddress),
        new PublicKey(this.longReserve.cTokenMint),
        new PublicKey(this.pool.address),
        this.lendingMarketAuthority,
        new PublicKey(this.longReserve.cTokenLiquidityAddress),
        this.obligationAddress,
        this.owner,
        new PublicKey(this.longReserve.pythOracle),
        new PublicKey(this.longReserve.switchboardOracle),
        this.owner,
        SOLEND_PRODUCTION_PROGRAM_ID
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
        refreshReserveInstruction(
          new PublicKey(reserve.address),
          SOLEND_PRODUCTION_PROGRAM_ID,
          new PublicKey(reserve.pythOracle),
          new PublicKey(reserve.switchboardOracle)
        )
      );
    });

    ixs.push(
      refreshObligationInstruction(
        this.obligationAddress,
        depositKeys,
        borrowKeys,
        SOLEND_PRODUCTION_PROGRAM_ID
      )
    );

    ixs.push(
      withdrawObligationCollateralAndRedeemReserveLiquidity(
        0,
        new PublicKey(this.shortReserve.cTokenLiquidityAddress),
        new PublicKey(this.shortReserveCollateralAta),
        new PublicKey(this.shortReserve.address),
        new PublicKey(this.obligationAddress),
        new PublicKey(this.pool.address),
        this.lendingMarketAuthority,
        new PublicKey(this.shortReserveLiquidityAta),
        new PublicKey(this.shortReserve.cTokenMint),
        new PublicKey(this.shortReserve.liquidityAddress),
        new PublicKey(this.owner),
        new PublicKey(this.owner),
        SOLEND_PRODUCTION_PROGRAM_ID
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
      allKeys.push(new PublicKey(this.shortReserve.address));
    }

    allKeys.forEach((k) => {
      const reserve = this.pool.reserves.find(
        (r) => r.address === k.toString()
      );

      if (!reserve) {
        throw new Error(`Failed to find reserve for address: ${k.toString()}`);
      }

      ixs.push(
        refreshReserveInstruction(
          new PublicKey(reserve.address),
          SOLEND_PRODUCTION_PROGRAM_ID,
          new PublicKey(reserve.pythOracle),
          new PublicKey(reserve.switchboardOracle)
        )
      );
    });

    ixs.push(
      refreshObligationInstruction(
        new PublicKey(this.obligationAddress),
        depositKeys,
        borrowKeys,
        SOLEND_PRODUCTION_PROGRAM_ID
      )
    );

    ixs.push(
      borrowObligationLiquidityInstruction(
        0,
        new PublicKey(this.shortReserve.liquidityAddress),
        new PublicKey(this.shortReserveLiquidityAta),
        new PublicKey(this.shortReserve.address),
        new PublicKey(this.shortReserve.feeReceiverAddress) ?? NULL_ORACLE,
        new PublicKey(this.obligationAddress),
        new PublicKey(this.pool.address),
        this.lendingMarketAuthority,
        this.owner,
        SOLEND_PRODUCTION_PROGRAM_ID
      )
    );

    // 7) repay flash loan
    ixs.push(
      flashRepayReserveLiquidityInstruction(
        0,
        0,
        new PublicKey(this.shortReserveLiquidityAta),
        new PublicKey(this.shortReserve.liquidityAddress),
        new PublicKey(this.shortReserve.feeReceiverAddress) ?? NULL_ORACLE,
        new PublicKey(this.shortReserve.feeReceiverAddress) ?? NULL_ORACLE,
        new PublicKey(this.shortReserve.address),
        new PublicKey(this.pool.address),
        this.owner,
        SOLEND_PRODUCTION_PROGRAM_ID
      )
    );
    const txn = new TransactionMessage({
      payerKey: this.owner,
      recentBlockhash: "",
      instructions: ixs,
    }).compileToLegacyMessage();

    return txn.accountKeys.length;
  };

  leverTx = async (
    swapBaseAmount: BN,
    route: {
      outAmount: JSBI;
      slippageBps: number;
    },
    swapInstructions: Array<TransactionInstruction>,
    lookupTableAccounts: AddressLookupTableAccount[]
  ) => {
    const swapBaseBigNumber = new BigNumber(swapBaseAmount.toString());
    const fee = swapBaseBigNumber
      .multipliedBy(new BigNumber(this.shortReserve.flashLoanFee).toString())
      .integerValue(BigNumber.ROUND_CEIL);

    let finalAddressLookupTableAccounts: AddressLookupTableAccount[] = [];

    // High level:
    // 1) flash borrow short token
    // 2) swap short -> long
    // 3) repay prev long borrows if any
    // 4) deposit remaining long after repay
    // 5) withdraw prev short if any
    // 6) borrow remaining short needed to repay flash loan
    // 7) repay flash borrow
    const ixs: TransactionInstruction[] = [];

    ixs.push(
      flashBorrowReserveLiquidityInstruction(
        swapBaseAmount,
        new PublicKey(this.shortReserve.liquidityAddress),
        new PublicKey(this.shortReserveLiquidityAta),
        new PublicKey(this.shortReserve.address),
        new PublicKey(this.pool.address),
        SOLEND_PRODUCTION_PROGRAM_ID
      )
    );

    swapInstructions.forEach((ix) => ixs.push(ix));
    finalAddressLookupTableAccounts = [...lookupTableAccounts];

    const longBalancePostSlippage = new BigNumber(route.outAmount.toString())
      .multipliedBy(1 - route.slippageBps / 10000)
      .integerValue(BigNumber.ROUND_FLOOR);

    // 3) repay any prev long borrows
    const prevLongBorrowAmount =
      this.obligation?.borrows
        ?.find((b) => b.reserveAddress === this.longReserve.address)
        ?.amount?.shiftedBy(this.longReserve.decimals)
        .toString() ?? "0";
    const maxLongRepayAmount = BigNumber.min(
      prevLongBorrowAmount,
      longBalancePostSlippage
    );
    const longBalancePostRepay =
      longBalancePostSlippage.minus(maxLongRepayAmount);
    if (!maxLongRepayAmount.isZero()) {
      // non-zero deposit amount post repay means we need to max repay
      let repayAmount;
      if (longBalancePostRepay.isZero()) {
        repayAmount = new BN(maxLongRepayAmount.toString());
      } else {
        repayAmount = new BN(U64_MAX);
        this.borrowKeys = this.borrowKeys.filter(
          (k) => k.toString() !== this.longReserve.address
        );
      }

      ixs.push(
        repayObligationLiquidityInstruction(
          repayAmount,
          new PublicKey(this.longReserveLiquidityAta),
          new PublicKey(this.longReserve.liquidityAddress),
          new PublicKey(this.longReserve.address),
          new PublicKey(this.obligationAddress),
          new PublicKey(this.pool.address),
          this.owner,
          SOLEND_PRODUCTION_PROGRAM_ID
        )
      );
    }

    // 4) deposit remaining long balance
    if (!longBalancePostRepay.isZero()) {
      // add newly deposited long reserve from step 4 if not already in deposits
      if (
        !this.depositKeys.find((k) => k.toString() === this.longReserve.address)
      ) {
        this.depositKeys.push(new PublicKey(this.longReserve.address));
      }

      ixs.push(
        depositReserveLiquidityAndObligationCollateralInstruction(
          new BN(longBalancePostRepay.toString()),
          new PublicKey(this.longReserveLiquidityAta),
          new PublicKey(this.longReserveCollateralAta),
          new PublicKey(this.longReserve.address),
          new PublicKey(this.longReserve.liquidityAddress),
          new PublicKey(this.longReserve.cTokenMint),
          new PublicKey(this.pool.address),
          this.lendingMarketAuthority,
          new PublicKey(this.longReserve.cTokenLiquidityAddress),
          new PublicKey(this.obligationAddress),
          this.owner,
          new PublicKey(this.longReserve.pythOracle),
          new PublicKey(this.longReserve.switchboardOracle),
          this.owner,
          SOLEND_PRODUCTION_PROGRAM_ID
        )
      );
    }

    // 5) withdraw prev available short token to repay flash loan
    const flashLoanAmountWithFee = swapBaseBigNumber.plus(fee);
    const prevShortSupplyAmount =
      this.obligation?.deposits
        ?.find((b) => b.reserveAddress === this.shortReserve.address)
        ?.amount?.shiftedBy(this.shortReserve.decimals) ?? new BigNumber("0");
    const shortWithdrawAmount = BigNumber.min(
      flashLoanAmountWithFee,
      prevShortSupplyAmount
    );
    const shortBorrowAmountPostWithdrawal =
      flashLoanAmountWithFee.minus(shortWithdrawAmount);

    if (!shortWithdrawAmount.isZero()) {
      this.depositKeys.concat(this.borrowKeys).forEach((k) => {
        const reserve = this.pool.reserves.find(
          (r) => r.address === k.toString()
        );

        if (!reserve) {
          throw new Error(
            `Failed to find reserve for address: ${k.toString()}`
          );
        }

        ixs.push(
          refreshReserveInstruction(
            new PublicKey(reserve.address),
            SOLEND_PRODUCTION_PROGRAM_ID,
            new PublicKey(reserve.pythOracle),
            new PublicKey(reserve.switchboardOracle)
          )
        );
      });

      ixs.push(
        refreshObligationInstruction(
          new PublicKey(this.obligationAddress),
          this.depositKeys,
          this.borrowKeys,
          SOLEND_PRODUCTION_PROGRAM_ID
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
        withdrawCtokens = new BN(
          shortWithdrawAmount
            .dividedBy(new BigNumber(this.shortReserve.cTokenExchangeRate))
            .integerValue(BigNumber.ROUND_FLOOR)
            .toString()
        );
      } else {
        withdrawCtokens = new BN(U64_MAX);
        this.depositKeys = this.depositKeys.filter(
          (k) => k.toString() !== this.shortReserve.address
        );
      }

      ixs.push(
        withdrawObligationCollateralAndRedeemReserveLiquidity(
          withdrawCtokens,
          new PublicKey(this.shortReserve.cTokenLiquidityAddress),
          new PublicKey(this.shortReserveCollateralAta),
          new PublicKey(this.shortReserve.address),
          new PublicKey(this.obligationAddress),
          new PublicKey(this.pool.address),
          this.lendingMarketAuthority,
          new PublicKey(this.shortReserveLiquidityAta),
          new PublicKey(this.shortReserve.cTokenMint),
          new PublicKey(this.shortReserve.liquidityAddress),
          new PublicKey(this.owner),
          new PublicKey(this.owner),
          SOLEND_PRODUCTION_PROGRAM_ID
        )
      );
    }
    console.log(
      "borrow short token amount needed after withdrawwal: ",
      shortBorrowAmountPostWithdrawal.toString()
    );
    // 6) borrow short token amount to repay flash loan if necessary
    if (!shortBorrowAmountPostWithdrawal.isZero()) {
      const allKeys = this.depositKeys.concat(this.borrowKeys);

      // add new borrow key if user wasn't already borrowing from this reserve
      if (
        !this.borrowKeys.find(
          (b) => b.toString() === this.shortReserve.address.toString()
        )
      ) {
        allKeys.push(new PublicKey(this.shortReserve.address));
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
          refreshReserveInstruction(
            new PublicKey(reserve.address),
            SOLEND_PRODUCTION_PROGRAM_ID,
            new PublicKey(reserve.pythOracle),
            new PublicKey(reserve.switchboardOracle)
          )
        );
      });

      ixs.push(
        refreshObligationInstruction(
          new PublicKey(this.obligationAddress),
          this.depositKeys,
          this.borrowKeys,
          SOLEND_PRODUCTION_PROGRAM_ID
        )
      );

      ixs.push(
        borrowObligationLiquidityInstruction(
          new BN(shortBorrowAmountPostWithdrawal.toString()),
          new PublicKey(this.shortReserve.liquidityAddress),
          new PublicKey(this.shortReserveLiquidityAta),
          new PublicKey(this.shortReserve.address),
          new PublicKey(this.shortReserve.feeReceiverAddress) ?? NULL_ORACLE,
          new PublicKey(this.obligationAddress),
          new PublicKey(this.pool.address),
          this.lendingMarketAuthority,
          this.owner,
          SOLEND_PRODUCTION_PROGRAM_ID
        )
      );
    }

    // 7) repay flash loan
    ixs.push(
      flashRepayReserveLiquidityInstruction(
        new BN(swapBaseAmount),
        0,
        new PublicKey(this.shortReserveLiquidityAta),
        new PublicKey(this.shortReserve.liquidityAddress),
        new PublicKey(this.shortReserve.feeReceiverAddress) ?? NULL_ORACLE,
        new PublicKey(this.shortReserve.feeReceiverAddress) ?? NULL_ORACLE,
        new PublicKey(this.shortReserve.address),
        new PublicKey(this.pool.address),
        this.owner,
        SOLEND_PRODUCTION_PROGRAM_ID
      )
    );

    const blockhash = await this.connection
      .getLatestBlockhash()
      .then((res) => res.blockhash);

    const messageV0 = new TransactionMessage({
      payerKey: this.owner,
      recentBlockhash: blockhash,
      instructions: ixs,
    }).compileToV0Message(finalAddressLookupTableAccounts);

    return new VersionedTransaction(messageV0);
  };
}
