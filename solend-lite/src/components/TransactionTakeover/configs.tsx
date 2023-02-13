import {
  Connection,
  PublicKey,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { ObligationType } from 'stores/obligations';
import { SelectedReserveType } from 'stores/pools';
import { WalletType } from 'stores/wallet';
import { SolendAction, U64_MAX } from '@solendprotocol/solend-sdk';

const SOL_PADDING_FOR_RENT_AND_FEE = 0.001;

export const supplyConfigs = {
  action: async (
    value: string,
    publicKey: string,
    selectedReserve: SelectedReserveType,
    connection: Connection,
    sendTransaction: (
      txn: Transaction,
      connection: Connection,
    ) => Promise<TransactionSignature>,
  ) => {
    const solendAction = await SolendAction.buildDepositTxns(
      connection,
      value,
      // Should use reserve address
      selectedReserve.symbol,
      new PublicKey(publicKey),
      'production',
      new PublicKey(selectedReserve.poolAddress),
    );

    return solendAction.sendTransactions(sendTransaction);
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
      ? obligation.borrowLimit.plus(
          valueObj.times(reserve.price).times(reserve.loanToValueRatio),
        )
      : null;
    const newBorrowUtilization =
      newBorrowLimit && !newBorrowLimit.isZero()
        ? obligation.totalBorrowValue.dividedBy(newBorrowLimit)
        : null;

    return {
      borrowLimit: obligation.borrowLimit,
      newBorrowLimit,
      utilization: obligation.borrowUtilization,
      newBorrowUtilization,
      calculatedBorrowFee: null,
    };
  },
  calculateMax: (reserve: SelectedReserveType, wallet: WalletType) => {
    const supplyCapRemaining = BigNumber.max(
      reserve.reserveSupplyCap.minus(reserve.totalSupply).minus(0.2),
      new BigNumber(0),
    );

    const asset = wallet.find((ass) => ass.mintAddress === reserve.mintAddress);

    if (!asset) return new BigNumber(0);

    const maxSuppliableFromWallet =
      reserve.symbol === 'SOL'
        ? asset.amount.minus(SOL_PADDING_FOR_RENT_AND_FEE)
        : asset.amount;

    return BigNumber.min(
      maxSuppliableFromWallet,
      supplyCapRemaining,
    ).decimalPlaces(reserve.decimals);
  },
};

export const borrowConfigs = {
  action: async (
    value: string,
    publicKey: string,
    selectedReserve: SelectedReserveType,
    connection: Connection,
    sendTransaction: (
      txn: Transaction,
      connection: Connection,
    ) => Promise<TransactionSignature>,
  ) => {
    const solendAction = await SolendAction.buildBorrowTxns(
      connection,
      value,
      // Should use reserve address
      selectedReserve.symbol,
      new PublicKey(publicKey),
      'production',
      undefined,
      new PublicKey(selectedReserve.poolAddress),
    );

    return solendAction.sendTransactions(sendTransaction);
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
      !valueObj.isNaN() && !obligation.borrowLimit.isZero()
        ? obligation.totalBorrowValue
            .plus(valueObj.times(reserve.price))
            .dividedBy(obligation.borrowLimit)
        : null;

    return {
      borrowLimit: obligation.borrowLimit,
      newBorrowLimit: null,
      utilization: obligation.borrowUtilization,
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
  ) => {
    if (!obligation) {
      return new BigNumber(0);
    }

    const borrowCapRemaining = reserve.reserveBorrowCap.minus(
      reserve.totalBorrow,
    );

    const borrowableAmountUntil95utilization = BigNumber.max(
      new BigNumber(reserve.availableAmount).minus(
        new BigNumber(reserve.totalSupply).times(new BigNumber(0.05)),
      ),
      BigNumber(0),
    );

    return BigNumber.min(
      obligation.borrowLimit
        .minus(obligation.totalBorrowValue)
        .dividedBy(reserve.price),
      borrowableAmountUntil95utilization,
      borrowCapRemaining,
    ).decimalPlaces(reserve.decimals);
  },
};

export const withdrawConfigs = {
  action: async (
    value: string,
    publicKey: string,
    selectedReserve: SelectedReserveType,
    connection: Connection,
    sendTransaction: (
      txn: Transaction,
      connection: Connection,
    ) => Promise<TransactionSignature>,
  ) => {
    const solendAction = await SolendAction.buildWithdrawTxns(
      connection,
      value,
      // Should use reserve address
      selectedReserve.symbol,
      new PublicKey(publicKey),
      'production',
      new PublicKey(selectedReserve.poolAddress),
    );

    return solendAction.sendTransactions(sendTransaction);
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
      ? obligation.borrowLimit.minus(
          valueObj.times(reserve.price).times(reserve.loanToValueRatio),
        )
      : null;

    const newBorrowUtilization =
      newBorrowLimit && !newBorrowLimit.isZero()
        ? obligation.totalBorrowValue.dividedBy(newBorrowLimit)
        : null;

    return {
      borrowLimit: obligation.borrowLimit,
      newBorrowLimit: newBorrowLimit,
      utilization: obligation.borrowUtilization,
      newBorrowUtilization,
      calculatedBorrowFee: null,
    };
  },
  calculateMax: (
    reserve: SelectedReserveType,
    _wallet: WalletType,
    obligation: ObligationType | null,
  ) => {
    if (!obligation) {
      return new BigNumber(0);
    }

    const reserveDepositedAmount = obligation.deposits.find(
      (d) => d.reserveAddress === reserve.address,
    );
    if (!reserveDepositedAmount) return BigNumber(0);

    const constantBorrowLimit = obligation.borrowLimit.minus(
      reserveDepositedAmount.amount
        .times(reserve.price)
        .times(reserve.loanToValueRatio),
    );

    const collateralWithdrawLimit = !reserve.price.isZero()
      ? BigNumber.max(
          reserveDepositedAmount.amount.minus(
            obligation.totalBorrowValue
              .minus(constantBorrowLimit)
              .dividedBy(reserve.price.times(reserve.loanToValueRatio)),
          ),
          new BigNumber(0),
        )
      : new BigNumber(U64_MAX);

    return BigNumber.min(
      reserveDepositedAmount.amount,
      collateralWithdrawLimit,
      reserve.availableAmount,
    ).decimalPlaces(reserve.decimals);
  },
};

export const repayConfigs = {
  action: async (
    value: string,
    publicKey: string,
    selectedReserve: SelectedReserveType,
    connection: Connection,
    sendTransaction: (
      txn: Transaction,
      connection: Connection,
    ) => Promise<TransactionSignature>,
  ) => {
    const solendAction = await SolendAction.buildRepayTxns(
      connection,
      value,
      // Should use reserve address
      selectedReserve.symbol,
      new PublicKey(publicKey),
      'production',
      new PublicKey(selectedReserve.poolAddress),
    );

    return solendAction.sendTransactions(sendTransaction);
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
      !valueObj.isNaN() && !obligation.borrowLimit.isZero()
        ? obligation.totalBorrowValue
            .minus(valueObj.times(reserve.price))
            .dividedBy(obligation.borrowLimit)
        : null;

    return {
      borrowLimit: obligation.borrowLimit,
      newBorrowLimit: null,
      utilization: obligation.borrowUtilization,
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
