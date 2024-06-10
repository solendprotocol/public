import { Connection, PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { ObligationType } from 'stores/obligations';
import { SelectedReserveType } from 'stores/pools';
import {
  PoolType,
  POSITION_LIMIT,
  SolendActionCore,
  U64_MAX,
  WalletType,
  ParsedRateLimiter,
} from '@solendprotocol/solend-sdk';
import { getAssociatedTokenAddress, NATIVE_MINT } from '@solana/spl-token';
import { ENVIRONMENT, HOST_ATA } from 'common/config';
import { sendAndConfirmStrategy } from 'components/TransactionTakeover/util';
import { WalletContextState } from '@solana/wallet-adapter-react';

const SOL_PADDING_FOR_RENT_AND_FEE = 0.02;

export function sufficientSOLForTransaction(wallet: WalletType) {
  return wallet
    .find((a) => a.mintAddress === NATIVE_MINT.toBase58())
    ?.amount?.isGreaterThanOrEqualTo(
      new BigNumber(SOL_PADDING_FOR_RENT_AND_FEE).times(0.9),
    );
}

export const supplyConfigs = {
  action: async (
    value: string,
    publicKey: string,
    pool: PoolType,
    selectedReserve: SelectedReserveType,
    connection: Connection,
    sendTransaction: WalletContextState['sendTransaction'],
    signAllTransactions: WalletContextState['signAllTransactions'],
    signCallback?: () => void,
    preCallback?: () => void,
    lendingCallback?: () => void,
    postCallback?: () => void,
    skipPreflight?: boolean,
  ) => {
    const solendAction = await SolendActionCore.buildDepositTxns(
      pool,
      selectedReserve,
      connection,
      value,
      new PublicKey(publicKey),
      ENVIRONMENT,
    );

    return sendAndConfirmStrategy(
      solendAction,
      connection,
      sendTransaction,
      signAllTransactions,
      signCallback,
      preCallback,
      lendingCallback,
      postCallback,
      skipPreflight,
    );
  },
  verifyAction: (
    value: BigNumber,
    obligation: ObligationType | null,
    reserve: SelectedReserveType,
    wallet: WalletType,
  ) => {
    if (!obligation) return null;

    // Allow action despite position limit, provided user already has a position in this asset
    const positionLimitReached =
      obligation.positions > POSITION_LIMIT &&
      !obligation.deposits
        .map((d) => d.reserveAddress)
        .includes(reserve.address);

    if (positionLimitReached) {
      return 'Max number of positions reached';
    }
    if (
      reserve.totalSupply.plus(value).isGreaterThan(reserve.reserveSupplyCap)
    ) {
      return 'Over reserve deposit limit';
    }
    if (
      value.isGreaterThan(
        wallet.find((a) => a.mintAddress === reserve.mintAddress)?.amount ?? 0,
      )
    ) {
      return 'Insufficient balance';
    }
    if (!sufficientSOLForTransaction(wallet)) {
      return 'Min 0.02 SOL required for transaction and fees';
    }
    if (value.isZero()) {
      return 'Enter an amount';
    }
    return null;
  },
  getNewCalculations: (
    obligation: ObligationType | null,
    reserve: SelectedReserveType,
    value: string,
  ) => {
    if (!obligation) {
      return {
        borrowLimit: null,
        newBorrowLimit: null,
        utilization: null,
        newBorrowUtilization: null,
        calculatedBorrowFee: null,
      };
    }

    const valueObj = new BigNumber(value);

    const newBorrowLimit = !valueObj.isNaN()
      ? obligation.minPriceBorrowLimit.plus(
          valueObj.times(reserve.minPrice).times(reserve.loanToValueRatio),
        )
      : null;
    const newBorrowUtilization =
      newBorrowLimit && !newBorrowLimit.isZero()
        ? obligation.weightedTotalBorrowValue.dividedBy(newBorrowLimit)
        : null;

    return {
      borrowLimit: obligation.minPriceBorrowLimit,
      newBorrowLimit,
      utilization: obligation.weightedConservativeBorrowUtilization,
      newBorrowUtilization,
      calculatedBorrowFee: null,
    };
  },
  calculateMax: (reserve: SelectedReserveType, wallet: WalletType) => {
    const supplyCapRemaining = reserve.reserveSupplyCap
      .minus(reserve.totalSupply)
      .minus(0.2);

    const asset = wallet.find((ass) => ass.mintAddress === reserve.mintAddress);

    if (!asset) return new BigNumber(0);

    const maxSuppliableFromWallet =
      reserve.symbol === 'SOL'
        ? asset.amount.minus(SOL_PADDING_FOR_RENT_AND_FEE)
        : asset.amount;

    return BigNumber.max(
      BigNumber.min(maxSuppliableFromWallet, supplyCapRemaining),
      new BigNumber(0),
    ).decimalPlaces(reserve.decimals);
  },
};

export const borrowConfigs = {
  action: async (
    value: string,
    publicKey: string,
    pool: PoolType,
    selectedReserve: SelectedReserveType,
    connection: Connection,
    sendTransaction: WalletContextState['sendTransaction'],
    signAllTransactions: WalletContextState['signAllTransactions'],
    signCallback?: () => void,
    preCallback?: () => void,
    lendingCallback?: () => void,
    postCallback?: () => void,
    skipPreflight?: boolean,
  ) => {
    let hostAta = undefined;
    if (HOST_ATA) {
      const hostTokenAccountAddress = await getAssociatedTokenAddress(
        new PublicKey(selectedReserve.mintAddress),
        new PublicKey(HOST_ATA),
      );

      const hostTokenAccountInfo = await connection.getAccountInfo(
        hostTokenAccountAddress,
      );

      if (hostTokenAccountInfo) {
        hostAta = hostTokenAccountAddress;
      }
    }

    const solendAction = await SolendActionCore.buildBorrowTxns(
      pool,
      selectedReserve,
      connection,
      value,
      new PublicKey(publicKey),
      ENVIRONMENT,
      undefined,
      hostAta,
    );

    return sendAndConfirmStrategy(
      solendAction,
      connection,
      sendTransaction,
      signAllTransactions,
      signCallback,
      preCallback,
      lendingCallback,
      postCallback,
      skipPreflight,
    );
  },
  verifyAction: (
    value: BigNumber,
    obligation: ObligationType | null,
    reserve: SelectedReserveType,
    wallet: WalletType,
    rateLimiter: ParsedRateLimiter | null,
  ) => {
    if (!obligation) return null;

    const borrowableAmountUntil95utilization = BigNumber.max(
      new BigNumber(reserve.availableAmount).minus(
        new BigNumber(reserve.totalSupply).times(new BigNumber(0.05)),
      ),
      BigNumber(0),
    );

    const overBorrowLimit = obligation.minPriceBorrowLimit
      .minus(obligation.maxPriceUserTotalWeightedBorrow)
      .dividedBy(reserve.maxPrice)
      .dividedBy(reserve.borrowWeight);

    // Allow action despite position limit, provided user already has a position in this asset
    const positionLimitReached =
      obligation.positions > POSITION_LIMIT &&
      !obligation.borrows
        .map((d) => d.reserveAddress)
        .includes(reserve.address);

    const reserveRateLimit =
      reserve.rateLimiter.remainingOutflow?.dividedBy(
        new BigNumber(10 ** reserve.decimals),
      ) ?? new BigNumber(U64_MAX);

    const poolRateLimit =
      rateLimiter?.remainingOutflow?.dividedBy(reserve.maxPrice) ??
      new BigNumber(U64_MAX);

    if (positionLimitReached) {
      return 'Max number of positions reached';
    }
    if (value.isGreaterThan(reserve.availableAmount)) {
      return 'Insufficient liquidity to borrow';
    }
    if (
      obligation?.maxPriceUserTotalWeightedBorrow
        .plus(value)
        .isGreaterThanOrEqualTo(reserve.reserveBorrowCap)
    ) {
      return 'Over reserve borrow limit';
    }
    if (value.isGreaterThan(borrowableAmountUntil95utilization)) {
      return 'Cannot borrow if it brings utilization over 95%';
    }
    if (value.isGreaterThan(overBorrowLimit)) {
      return 'Exceeds borrow limit';
    }
    if (value.isGreaterThan(poolRateLimit)) {
      return 'Pool outflow rate limit surpassed';
    }
    if (value.isGreaterThan(reserveRateLimit)) {
      return 'Reserve outflow rate limit surpassed';
    }
    if (!sufficientSOLForTransaction(wallet)) {
      return 'Min 0.02 SOL required for transaction and fees';
    }
    if (value.isZero()) {
      return 'Enter an amount';
    }
    return null;
  },
  getNewCalculations: (
    obligation: ObligationType | null,
    reserve: SelectedReserveType,
    value: string,
  ) => {
    if (!obligation) {
      return {
        borrowLimit: null,
        newBorrowLimit: null,
        utilization: null,
        newBorrowUtilization: null,
        calculatedBorrowFee: null,
      };
    }

    const valueObj = new BigNumber(value);

    const newBorrowUtilization =
      !valueObj.isNaN() && !obligation.minPriceBorrowLimit.isZero()
        ? obligation.maxPriceUserTotalWeightedBorrow
            .plus(valueObj.times(reserve.maxPrice).times(reserve.borrowWeight))
            .dividedBy(obligation.minPriceBorrowLimit)
        : null;

    return {
      borrowLimit: obligation.minPriceBorrowLimit,
      newBorrowLimit: null,
      utilization: obligation.weightedConservativeBorrowUtilization,
      newBorrowUtilization,
      calculatedBorrowFee: valueObj.isNaN()
        ? null
        : valueObj.times(new BigNumber(reserve.borrowFee)),
    };
  },
  calculateMax: (
    reserve: SelectedReserveType,
    _wallet: WalletType,
    obligation: ObligationType | null,
    rateLimiter: ParsedRateLimiter | null,
  ) => {
    if (!obligation) {
      return new BigNumber(0);
    }

    const borrowCapRemaining = reserve.reserveBorrowCap.minus(
      reserve.totalBorrow,
    );

    const borrowableAmountUntil95utilization = new BigNumber(
      reserve.availableAmount,
    ).minus(new BigNumber(reserve.totalSupply).times(new BigNumber(0.05)));

    const reserveRateLimit =
      reserve.rateLimiter.remainingOutflow?.dividedBy(
        new BigNumber(10 ** reserve.decimals),
      ) ?? new BigNumber(U64_MAX);

    const poolRateLimit =
      rateLimiter?.remainingOutflow?.dividedBy(reserve.maxPrice) ??
      new BigNumber(U64_MAX);

    return BigNumber.max(
      BigNumber.min(
        obligation.minPriceBorrowLimit
          .minus(obligation.maxPriceUserTotalWeightedBorrow)
          .dividedBy(reserve.maxPrice)
          .dividedBy(reserve.borrowWeight),
        borrowableAmountUntil95utilization,
        borrowCapRemaining,
        poolRateLimit,
        reserveRateLimit,
      ),
      BigNumber(0),
    ).decimalPlaces(reserve.decimals);
  },
};

export const withdrawConfigs = {
  action: async (
    value: string,
    publicKey: string,
    pool: PoolType,
    selectedReserve: SelectedReserveType,
    connection: Connection,
    sendTransaction: WalletContextState['sendTransaction'],
    signAllTransactions: WalletContextState['signAllTransactions'],
    signCallback?: () => void,
    preCallback?: () => void,
    lendingCallback?: () => void,
    postCallback?: () => void,
    skipPreflight?: boolean,
  ) => {
    const solendAction = await SolendActionCore.buildWithdrawTxns(
      pool,
      selectedReserve,
      connection,
      value,
      new PublicKey(publicKey),
      ENVIRONMENT,
    );

    return sendAndConfirmStrategy(
      solendAction,
      connection,
      sendTransaction,
      signAllTransactions,
      signCallback,
      preCallback,
      lendingCallback,
      postCallback,
      skipPreflight,
    );
  },
  verifyAction: (
    value: BigNumber,
    obligation: ObligationType | null,
    reserve: SelectedReserveType,
    wallet: WalletType,
    rateLimiter: ParsedRateLimiter | null,
  ) => {
    if (!obligation) return null;

    const reserveDepositedAmount = obligation.deposits.find(
      (d) => d.reserveAddress === reserve.address,
    )?.amount;
    if (!reserveDepositedAmount) return null;

    const constantBorrowLimit = obligation.minPriceBorrowLimit.minus(
      reserveDepositedAmount
        .times(reserve.minPrice)
        .times(reserve.loanToValueRatio),
    );

    const collateralWithdrawLimit = !(
      reserve.price.isZero() || !reserve.loanToValueRatio
    )
      ? BigNumber.max(
          reserveDepositedAmount.minus(
            BigNumber.max(
              BigNumber(0),
              obligation?.totalBorrowValue
                .minus(constantBorrowLimit)
                .dividedBy(reserve.minPrice.times(reserve.loanToValueRatio)),
            ),
          ),
          0,
        )
      : new BigNumber(U64_MAX);

    const reserveRateLimit =
      reserve.rateLimiter.remainingOutflow?.dividedBy(
        new BigNumber(10 ** reserve.decimals),
      ) ?? new BigNumber(U64_MAX);

    const poolRateLimit =
      rateLimiter?.remainingOutflow?.dividedBy(reserve.maxPrice) ??
      new BigNumber(U64_MAX);

    if (value.isGreaterThan(reserve.availableAmount)) {
      return 'Insufficient liquidity to withdraw';
    }
    if (value.isGreaterThan(reserveDepositedAmount)) {
      return 'Cannot withdraw more than deposited supply';
    }
    if (value.isGreaterThan(collateralWithdrawLimit)) {
      return 'Cannot withdraw into undercollateralization';
    }
    if (!sufficientSOLForTransaction(wallet)) {
      return 'Min 0.02 SOL required for transaction and fees';
    }
    if (value.isGreaterThan(poolRateLimit)) {
      return 'Pool outflow rate limit surpassed';
    }
    if (value.isGreaterThan(reserveRateLimit)) {
      return 'Reserve outflow rate limit surpassed';
    }
    return null;
  },
  getNewCalculations: (
    obligation: ObligationType | null,
    reserve: SelectedReserveType,
    value: string,
  ) => {
    if (!obligation) {
      return {
        borrowLimit: null,
        newBorrowLimit: null,
        utilization: null,
        newBorrowUtilization: null,
        calculatedBorrowFee: null,
      };
    }

    const valueObj = new BigNumber(value);

    const newBorrowLimit = !valueObj.isNaN()
      ? obligation.minPriceBorrowLimit.minus(
          valueObj.times(reserve.minPrice).times(reserve.loanToValueRatio),
        )
      : null;

    const newBorrowUtilization =
      newBorrowLimit && !newBorrowLimit.isZero()
        ? obligation.totalBorrowValue.dividedBy(newBorrowLimit)
        : null;

    return {
      borrowLimit: obligation.borrowLimit,
      newBorrowLimit: newBorrowLimit,
      utilization: obligation.weightedConservativeBorrowUtilization,
      newBorrowUtilization,
      calculatedBorrowFee: null,
    };
  },
  calculateMax: (
    reserve: SelectedReserveType,
    _wallet: WalletType,
    obligation: ObligationType | null,
    rateLimiter: ParsedRateLimiter | null,
  ) => {
    if (!obligation) {
      return new BigNumber(0);
    }

    const reserveDepositedAmount = obligation.deposits.find(
      (d) => d.reserveAddress === reserve.address,
    )?.amount;

    if (!reserveDepositedAmount) return BigNumber(0);

    const constantBorrowLimit = obligation.minPriceBorrowLimit.minus(
      reserveDepositedAmount
        .times(reserve.minPrice)
        .times(reserve.loanToValueRatio),
    );

    const collateralWithdrawLimit = !(
      reserve.minPrice.isZero() || !reserve.loanToValueRatio
    )
      ? reserveDepositedAmount.minus(
          BigNumber.max(
            BigNumber(0),
            obligation.totalBorrowValue
              .minus(constantBorrowLimit)
              .dividedBy(reserve.minPrice.times(reserve.loanToValueRatio)),
          ),
        )
      : new BigNumber(U64_MAX);

    const reserveRateLimit =
      reserve.rateLimiter.remainingOutflow?.dividedBy(
        new BigNumber(10 ** reserve.decimals),
      ) ?? new BigNumber(U64_MAX);

    const poolRateLimit =
      rateLimiter?.remainingOutflow?.dividedBy(reserve.maxPrice) ??
      new BigNumber(U64_MAX);

    return BigNumber.max(
      BigNumber.min(
        collateralWithdrawLimit,
        reserve.availableAmount,
        reserveRateLimit,
        poolRateLimit,
      ),
      new BigNumber(0),
    ).decimalPlaces(reserve.decimals);
  },
};

export const repayConfigs = {
  action: async (
    value: string,
    publicKey: string,
    pool: PoolType,
    selectedReserve: SelectedReserveType,
    connection: Connection,
    sendTransaction: WalletContextState['sendTransaction'],
    signAllTransactions: WalletContextState['signAllTransactions'],
    signCallback?: () => void,
    preCallback?: () => void,
    lendingCallback?: () => void,
    postCallback?: () => void,
    skipPreflight?: boolean,
  ) => {
    const solendAction = await SolendActionCore.buildRepayTxns(
      pool,
      selectedReserve,
      connection,
      value,
      new PublicKey(publicKey),
      ENVIRONMENT,
    );

    return sendAndConfirmStrategy(
      solendAction,
      connection,
      sendTransaction,
      signAllTransactions,
      signCallback,
      preCallback,
      lendingCallback,
      postCallback,
      skipPreflight,
    );
  },
  verifyAction: (
    value: BigNumber,
    obligation: ObligationType | null,
    reserve: SelectedReserveType,
    wallet: WalletType,
  ) => {
    if (!obligation) return null;

    const reserveBorrowedAmount = obligation.borrows.find(
      (b) => b.reserveAddress === reserve.address,
    )?.amount;
    if (!reserveBorrowedAmount) return null;

    if (
      value.isGreaterThan(
        wallet.find((a) => a.mintAddress === reserve.mintAddress)?.amount ?? 0,
      )
    ) {
      return 'Insufficient balance';
    }
    if (value.isGreaterThan(reserveBorrowedAmount)) {
      return 'Amount exceeded the amount borrowed';
    }
    if (!sufficientSOLForTransaction(wallet)) {
      return 'Min 0.02 SOL required for transaction and fees';
    }
    return null;
  },
  getNewCalculations: (
    obligation: ObligationType | null,
    reserve: SelectedReserveType,
    value: string,
  ) => {
    if (!obligation) {
      return {
        borrowLimit: null,
        newBorrowLimit: null,
        utilization: null,
        newBorrowUtilization: null,
        calculatedBorrowFee: null,
      };
    }

    const valueObj = new BigNumber(value);

    const newBorrowUtilization =
      !valueObj.isNaN() && !obligation.minPriceBorrowLimit.isZero()
        ? obligation.totalBorrowValue
            .minus(valueObj.times(reserve.maxPrice).times(reserve.borrowWeight))
            .dividedBy(obligation.minPriceBorrowLimit)
        : null;

    return {
      borrowLimit: obligation.minPriceBorrowLimit,
      newBorrowLimit: null,
      utilization: obligation.weightedConservativeBorrowUtilization,
      newBorrowUtilization,
      calculatedBorrowFee: null,
    };
  },
  calculateMax: (
    reserve: SelectedReserveType,
    wallet: WalletType,
    obligation: ObligationType | null,
  ) => {
    if (!obligation) {
      return new BigNumber(0);
    }

    // Don't read amount from wSOL and take SOL balance instead
    const asset = wallet.find(
      (ass) => ass.mintAddress === reserve.mintAddress && ass.symbol !== 'wSOL',
    );
    if (!asset) return new BigNumber(0);

    const reserveBorrowedAmount = obligation.borrows.find(
      (b) => b.reserveAddress === reserve.address,
    );
    if (!reserveBorrowedAmount) return BigNumber(0);

    const maxRepayableFromWallet =
      reserve.symbol === 'SOL'
        ? BigNumber.max(
            asset.amount.minus(SOL_PADDING_FOR_RENT_AND_FEE),
            new BigNumber(0),
          )
        : asset.amount;

    return BigNumber.min(
      reserveBorrowedAmount.amount,
      maxRepayableFromWallet,
    ).decimalPlaces(reserve.decimals);
  },
};
