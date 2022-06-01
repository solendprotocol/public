import BigNumber from "bignumber.js";

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
