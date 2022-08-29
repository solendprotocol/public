/* eslint-disable max-classes-per-file */
import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { SolendReserve } from "./reserve";
import { Obligation } from "../state/obligation";
import BN from "bn.js";
import { WAD } from "./constants";

export type Position = {
  mintAddress: string;
  amount: BN;
};

export type ObligationStats = {
  liquidationThreshold: number;
  userTotalDeposit: number;
  userTotalBorrow: number;
  borrowLimit: number;
  borrowUtilization: number;
  netAccountValue: number;
  positions: number;
};

export class SolendObligation {
  walletAddress: PublicKey;

  obligationAddress: PublicKey;

  deposits: Array<Position>;

  borrows: Array<Position>;

  obligationStats: ObligationStats;

  constructor(
    walletAddress: PublicKey,
    obligationAddress: PublicKey,
    obligation: Obligation,
    reserves: Array<SolendReserve>
  ) {
    this.walletAddress = walletAddress;
    this.obligationAddress = obligationAddress;

    const positionDetails = this.calculatePositions(obligation, reserves);

    this.deposits = positionDetails.deposits;
    this.borrows = positionDetails.borrows;
    this.obligationStats = positionDetails.stats;
  }

  private calculatePositions(
    obligation: Obligation,
    reserves: Array<SolendReserve>
  ) {
    let userTotalDeposit = new BigNumber(0);
    let borrowLimit = new BigNumber(0);
    let liquidationThreshold = new BigNumber(0);
    let positions = 0;

    const deposits = obligation.deposits.map((deposit) => {
      const reserve = reserves.find(
        (reserve) =>
          reserve.config.address === deposit.depositReserve.toBase58()
      );
      const loanToValue = reserve!.stats!.loanToValueRatio;
      const liqThreshold = reserve!.stats!.liquidationThreshold;

      const supplyAmount = new BN(
        Math.floor(
          new BigNumber(deposit.depositedAmount.toString())
            .multipliedBy(reserve!.stats!.cTokenExchangeRate)
            .toNumber()
        )
      );
      const supplyAmountUSD = new BigNumber(supplyAmount.toString())
        .multipliedBy(reserve!.stats!.assetPriceUSD)
        .dividedBy("1".concat(Array(reserve!.stats!.decimals + 1).join("0")));

      userTotalDeposit = userTotalDeposit.plus(supplyAmountUSD);

      borrowLimit = borrowLimit.plus(supplyAmountUSD.multipliedBy(loanToValue));

      liquidationThreshold = liquidationThreshold.plus(
        supplyAmountUSD.multipliedBy(liqThreshold)
      );

      if (!supplyAmount.eq(new BN("0"))) {
        positions += 1;
      }

      return {
        mintAddress: reserve!.config.liquidityToken.mint,
        amount: supplyAmount,
      };
    });

    let userTotalBorrow = new BigNumber(0);

    const borrows = obligation.borrows.map((borrow) => {
      const reserve = reserves.find(
        (reserve) => reserve.config.address === borrow.borrowReserve.toBase58()
      );

      const borrowAmount = new BN(
        Math.floor(
          new BigNumber(borrow.borrowedAmountWads.toString())
            .multipliedBy(reserve!.stats!.cumulativeBorrowRateWads.toString())
            .dividedBy(borrow.cumulativeBorrowRateWads.toString())
            .dividedBy(WAD)
            .toNumber()
        ).toString()
      );

      const borrowAmountUSD = new BigNumber(borrowAmount.toString())
        .multipliedBy(reserve!.stats!.assetPriceUSD)
        .dividedBy("1".concat(Array(reserve!.stats!.decimals + 1).join("0")));

      if (!borrowAmount.eq(new BN("0"))) {
        positions += 1;
      }

      userTotalBorrow = userTotalBorrow.plus(borrowAmountUSD);

      return {
        mintAddress: reserve!.config.liquidityToken.mint,
        amount: borrowAmount,
      };
    });

    return {
      deposits,
      borrows,
      stats: {
        liquidationThreshold: liquidationThreshold.toNumber(),
        userTotalDeposit: userTotalDeposit.toNumber(),
        userTotalBorrow: userTotalBorrow.toNumber(),
        borrowLimit: borrowLimit.toNumber(),
        borrowUtilization: userTotalBorrow.dividedBy(borrowLimit).toNumber(),
        netAccountValue: userTotalDeposit.minus(userTotalBorrow).toNumber(),
        positions,
      },
    };
  }
}
