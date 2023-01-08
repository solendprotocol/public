import BigNumber from "bignumber.js";
import BN from "bn.js";
import { Obligation } from "../state";
import { WAD } from "./constants";
import { SolendReserve } from "./reserve";

const SLOT_RATE = 2;
const DAILY_SLOTS = 24 * 60 * 60 * SLOT_RATE;
const ANNUAL_SLOTS = 365 * DAILY_SLOTS * SLOT_RATE;

type ObligationFarmScoreType = {
  obligationId: string;
  balance: string;
  debt: string;
  score: string;
  lastSlot: number;
  tokenMint: string;
  side: "supply" | "borrow";
};

type RewardRate = {
  beginningSlot: number;
  rewardRate: string;
  name?: string;
};

function getLatestRewardRate(
  rewardRates: Array<{
    beginningSlot: number;
    rewardRate: string;
    name?: string;
  }>,
  slot: number
) {
  return rewardRates
    .filter((rr) => slot >= rr.beginningSlot)
    .reduce((v1, v2) => (v1.beginningSlot > v2.beginningSlot ? v1 : v2), {
      beginningSlot: 0,
      rewardRate: "0",
    });
}

export const calculateNewScore = (
  rewardStat: {
    lastSlot: number;
    rewardRates: Array<RewardRate>;
    rewardsPerShare: string;
    totalBalance: string;
  },
  pool: ObligationFarmScoreType,
  rewardRate: string,
  endSlot: number,
  startSlot: number
) => {
  const { balance, debt, score } = pool;
  const { rewardsPerShare, totalBalance } = rewardStat;

  const oldDebt = new BigNumber(debt);
  const oldScore = new BigNumber(score);
  const oldRewardsPerShare = new BigNumber(rewardsPerShare);
  const oldBalance = new BigNumber(balance);
  const totalBalanceVal = new BigNumber(totalBalance);

  const newRewardsPerShare = !totalBalanceVal.isZero()
    ? oldRewardsPerShare.plus(
        new BigNumber(endSlot)
          .minus(new BigNumber(startSlot.toString()))
          .times(new BigNumber(rewardRate))
          .div(totalBalanceVal)
          .div(new BigNumber(ANNUAL_SLOTS))
      )
    : new BigNumber(0);

  return oldScore.plus(newRewardsPerShare.times(oldBalance).minus(oldDebt));
};

export const estimateCurrentScore = (
  rewardStat: {
    lastSlot: number;
    rewardRates: Array<RewardRate>;
    rewardsPerShare: string;
    totalBalance: string;
  },
  rewardScore: ObligationFarmScoreType,
  mostRecentSlot: number,
  mostRecentSlotTime: number
) => {
  const { lastSlot, rewardRates } = rewardStat;

  const estimatedCurrentSlot =
    mostRecentSlot + SLOT_RATE * (Date.now() / 1000 - mostRecentSlotTime);

  const { rewardRate } = getLatestRewardRate(rewardRates, estimatedCurrentSlot);

  const currentScore = calculateNewScore(
    rewardStat,
    rewardScore,
    rewardRate,
    estimatedCurrentSlot,
    lastSlot
  );

  return currentScore;
};



export function calculatePositions(
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