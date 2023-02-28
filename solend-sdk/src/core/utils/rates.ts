import BigNumber from "bignumber.js";
import { Reserve } from "../../state";
import { SLOTS_PER_YEAR } from "../constants";

const calculateSupplyAPR = (reserve: Reserve) => {
  const currentUtilization = calculateUtilizationRatio(reserve);

  const borrowAPR = calculateBorrowAPR(reserve);
  const protocolTakePercentage = BigNumber(1).minus(
    reserve.config.protocolTakeRate / 100
  );

  return currentUtilization.times(borrowAPR).times(protocolTakePercentage);
};

const calculateUtilizationRatio = (reserve: Reserve) => {
  const borrowedAmount = new BigNumber(
    reserve.liquidity.borrowedAmountWads.toString()
  ).shiftedBy(-18);
  const totalSupply = borrowedAmount.plus(
    reserve.liquidity.availableAmount.toString()
  );
  const currentUtilization = borrowedAmount.dividedBy(totalSupply);

  return currentUtilization;
};

const calculateBorrowAPR = (reserve: Reserve) => {
  const currentUtilization = calculateUtilizationRatio(reserve);
  const optimalUtilization = new BigNumber(
    reserve.config.optimalUtilizationRate / 100
  );

  let borrowAPR;
  if (
    optimalUtilization.isEqualTo(1) ||
    currentUtilization.isLessThan(optimalUtilization)
  ) {
    const normalizedFactor = currentUtilization.dividedBy(optimalUtilization);
    const optimalBorrowRate = new BigNumber(
      reserve.config.optimalBorrowRate / 100
    );
    const minBorrowRate = new BigNumber(reserve.config.minBorrowRate / 100);
    borrowAPR = normalizedFactor
      .times(optimalBorrowRate.minus(minBorrowRate))
      .plus(minBorrowRate);
  } else {
    if (reserve.config.optimalBorrowRate === reserve.config.maxBorrowRate) {
      return new BigNumber(
        computeExtremeRates(reserve.config.maxBorrowRate / 100)
      );
    }
    const normalizedFactor = currentUtilization
      .minus(optimalUtilization)
      .dividedBy(new BigNumber(1).minus(optimalUtilization));
    const optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
    const maxBorrowRate = reserve.config.maxBorrowRate / 100;
    borrowAPR = normalizedFactor
      .times(maxBorrowRate - optimalBorrowRate)
      .plus(optimalBorrowRate);
  }

  return borrowAPR;
};

const calculateSupplyAPY = (reserve: Reserve) => {
  const apr = calculateSupplyAPR(reserve);
  const apy =
    new BigNumber(1)
      .plus(new BigNumber(apr).dividedBy(SLOTS_PER_YEAR))
      .toNumber() **
      SLOTS_PER_YEAR -
    1;
  return new BigNumber(apy);
};

const calculateBorrowAPY = (reserve: Reserve) => {
  const apr = calculateBorrowAPR(reserve);
  const apy =
    new BigNumber(1)
      .plus(new BigNumber(apr).dividedBy(SLOTS_PER_YEAR))
      .toNumber() **
      SLOTS_PER_YEAR -
    1;
  return new BigNumber(apy);
};

export const calculateSupplyInterest = (reserve: Reserve, showApy: boolean) =>
  showApy ? calculateSupplyAPY(reserve) : calculateSupplyAPR(reserve);

export const calculateBorrowInterest = (reserve: Reserve, showApy: boolean) =>
  showApy ? calculateBorrowAPY(reserve) : calculateBorrowAPR(reserve);

export function computeExtremeRates(configRate: number) {
  const rate = 0.5;
  let cleanRate = configRate;

  if (configRate >= 2.47) {
    cleanRate = Number(configRate.toString().replace(".", ""));
  }

  switch (cleanRate) {
    case 251:
      return rate * 6;
    case 252:
      return rate * 7;
    case 253:
      return rate * 8;
    case 254:
      return rate * 10;
    case 255:
      return rate * 12;
    case 250:
      return rate * 20;
    case 249:
      return rate * 30;
    case 248:
      return rate * 40;
    case 247:
      return rate * 50;
    default:
      return cleanRate;
  }
}
