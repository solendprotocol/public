import {
  Connection,
  PublicKey,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { ObligationType } from 'stores/obligations';
import { SelectedReserveType } from 'stores/pools';
import {
  PoolType,
  POSITION_LIMIT,
  SolendActionCore,
  U64_MAX,
  WalletType,
} from '@solendprotocol/solend-sdk';
import { getAssociatedTokenAddress, NATIVE_MINT } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { ENVIRONMENT, HOST_ATA } from 'common/config';

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
    sendTransaction: (
      txn: Transaction,
      connection: Connection,
    ) => Promise<TransactionSignature>,
    preCallback?: () => void,
    lendingCallback?: () => void,
    postCallback?: () => void,
  ) => {
    const solendAction = await SolendActionCore.buildDepositTxns(
      pool,
      selectedReserve,
      connection,
      new BN(value),
      new PublicKey(publicKey),
      ENVIRONMENT,
    );

    return solendAction.sendTransactions(
      sendTransaction,
      preCallback,
      lendingCallback,
      postCallback,
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
    );
  },
};

export const borrowConfigs = {
  action: async (
    value: string,
    publicKey: string,
    pool: PoolType,
    selectedReserve: SelectedReserveType,
    connection: Connection,
    sendTransaction: (
      txn: Transaction,
      connection: Connection,
    ) => Promise<TransactionSignature>,
    preCallback?: () => void,
    lendingCallback?: () => void,
    postCallback?: () => void,
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

      // When self referring, user might not have the ATA for the borrow but we can assume it will be created
      // in the same transaction
      if (hostTokenAccountInfo) {
        hostAta = hostTokenAccountAddress;
      }
    }

    const solendAction = await SolendActionCore.buildBorrowTxns(
      pool,
      selectedReserve,
      connection,
      new BN(value),
      new PublicKey(publicKey),
      ENVIRONMENT,
      hostAta
    );

    return solendAction.sendTransactions(
      sendTransaction,
      preCallback,
      lendingCallback,
      postCallback,
    );
  },
  verifyAction: (
    value: BigNumber,
    obligation: ObligationType | null,
    reserve: SelectedReserveType,
    wallet: WalletType,
  ) => {
    if (!obligation) return null;

    const borrowableAmountUntil95utilization = BigNumber.max(
      new BigNumber(reserve.availableAmount).minus(
        new BigNumber(reserve.totalSupply).times(new BigNumber(0.05)),
      ),
      BigNumber(0),
    );

    const overBorrowLimit = obligation.borrowLimit
      .minus(obligation.totalBorrowValue)
      .dividedBy(reserve.price);

    // Allow action despite position limit, provided user already has a position in this asset
    const positionLimitReached =
      obligation.positions > POSITION_LIMIT &&
      !obligation.borrows
        .map((d) => d.reserveAddress)
        .includes(reserve.address);

    if (positionLimitReached) {
      return 'Max number of positions reached';
    }
    if (value.isGreaterThan(reserve.availableAmount)) {
      return 'Insufficient liquidity to borrow';
    }
    if (
      obligation?.totalBorrowValue
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

    const borrowableAmountUntil95utilization = new BigNumber(
      reserve.availableAmount,
    ).minus(new BigNumber(reserve.totalSupply).times(new BigNumber(0.05)));

    return BigNumber.max(
      BigNumber.min(
        obligation.borrowLimit
          .minus(obligation.totalBorrowValue)
          .dividedBy(reserve.price),
        borrowableAmountUntil95utilization,
        borrowCapRemaining,
      ),
      BigNumber(0),
    );
  },
};

export const withdrawConfigs = {
  action: async (
    value: string,
    publicKey: string,
    pool: PoolType,
    selectedReserve: SelectedReserveType,
    connection: Connection,
    sendTransaction: (
      txn: Transaction,
      connection: Connection,
    ) => Promise<TransactionSignature>,
    preCallback?: () => void,
    lendingCallback?: () => void,
    postCallback?: () => void,
  ) => {
    const solendAction = await SolendActionCore.buildWithdrawTxns(
      pool,
      selectedReserve,
      connection,
      new BN(value),
      new PublicKey(publicKey),
      ENVIRONMENT,
    );

    return solendAction.sendTransactions(
      sendTransaction,
      preCallback,
      lendingCallback,
      postCallback,
    );
  },
  verifyAction: (
    value: BigNumber,
    obligation: ObligationType | null,
    reserve: SelectedReserveType,
    wallet: WalletType,
  ) => {
    if (!obligation) return null;

    const reserveDepositedAmount = obligation.deposits.find(
      (d) => d.reserveAddress === reserve.address,
    )?.amount;
    if (!reserveDepositedAmount) return null;

    const constantBorrowLimit = obligation.borrowLimit.minus(
      reserveDepositedAmount
        .times(reserve.price)
        .times(reserve.loanToValueRatio),
    );

    const collateralWithdrawLimit = !(
      reserve.price.isZero() || !reserve.loanToValueRatio
    )
      ? BigNumber.max(
          reserveDepositedAmount.minus(
            obligation?.totalBorrowValue
              .minus(constantBorrowLimit)
              .dividedBy(reserve.price.times(reserve.loanToValueRatio)),
          ),
          0,
        )
      : new BigNumber(U64_MAX);

    if (value.isGreaterThan(reserve.availableAmount)) {
      return 'Insufficient liquidity to withdraw';
    }
    if (value.isGreaterThan(collateralWithdrawLimit)) {
      return 'Cannot withdraw into undercollateralization';
    }
    if (value.isGreaterThan(reserveDepositedAmount)) {
      return 'Cannot withdraw more than deposited supply';
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
    )?.amount;
    if (!reserveDepositedAmount) return BigNumber(0);

    const constantBorrowLimit = obligation.borrowLimit.minus(
      reserveDepositedAmount
        .times(reserve.price)
        .times(reserve.loanToValueRatio),
    );

    const collateralWithdrawLimit = !(
      reserve.price.isZero() || !reserve.loanToValueRatio
    )
      ? reserveDepositedAmount.minus(
          obligation.totalBorrowValue
            .minus(constantBorrowLimit)
            .dividedBy(reserve.price.times(reserve.loanToValueRatio)),
        )
      : new BigNumber(U64_MAX);

    return BigNumber.max(
      BigNumber.min(collateralWithdrawLimit, reserve.availableAmount),
      new BigNumber(0),
    );
  },
};

export const repayConfigs = {
  action: async (
    value: string,
    publicKey: string,
    pool: PoolType,
    selectedReserve: SelectedReserveType,
    connection: Connection,
    sendTransaction: (
      txn: Transaction,
      connection: Connection,
    ) => Promise<TransactionSignature>,
    preCallback?: () => void,
    lendingCallback?: () => void,
    postCallback?: () => void,
  ) => {
    const solendAction = await SolendActionCore.buildRepayTxns(
      pool,
      selectedReserve,
      connection,
      new BN(value),
      new PublicKey(publicKey),
      ENVIRONMENT,
    );

    return solendAction.sendTransactions(
      sendTransaction,
      preCallback,
      lendingCallback,
      postCallback,
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

    return BigNumber.min(reserveBorrowedAmount.amount, maxRepayableFromWallet);
  },
};
