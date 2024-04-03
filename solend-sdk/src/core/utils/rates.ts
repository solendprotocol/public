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
  const maxUtilizationRate = new BigNumber(
    reserve.config.maxUtilizationRate / 100
  );
  let borrowAPR;
  if (currentUtilization.isLessThanOrEqualTo(optimalUtilization)) {
    const minBorrowRate = new BigNumber(reserve.config.minBorrowRate / 100);
    if (optimalUtilization.isEqualTo(0)) {
      return minBorrowRate;
    }
    const normalizedFactor = currentUtilization.dividedBy(optimalUtilization);

    const optimalBorrowRate = new BigNumber(
      reserve.config.optimalBorrowRate / 100
    );

    borrowAPR = normalizedFactor
      .times(optimalBorrowRate.minus(minBorrowRate))
      .plus(minBorrowRate);
  } else if (currentUtilization.isLessThanOrEqualTo(maxUtilizationRate)) {
    const weight = currentUtilization
      .minus(optimalUtilization)
      .dividedBy(maxUtilizationRate.minus(optimalUtilization));

    const optimalBorrowRate = new BigNumber(
      reserve.config.optimalBorrowRate / 100
    );
    const maxBorrowRate = new BigNumber(reserve.config.maxBorrowRate / 100);

    borrowAPR = weight
      .times(maxBorrowRate.minus(optimalBorrowRate))
      .plus(optimalBorrowRate);
  } else {
    const weight = currentUtilization
      .minus(maxUtilizationRate)
      .dividedBy(new BigNumber(1).minus(maxUtilizationRate));

    const maxBorrowRate = new BigNumber(reserve.config.maxBorrowRate / 100);
    const superMaxBorrowRate = new BigNumber(
      reserve.config.superMaxBorrowRate.toNumber() / 100
    );

    borrowAPR = weight
      .times(superMaxBorrowRate.minus(maxBorrowRate))
      .plus(maxBorrowRate);
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
