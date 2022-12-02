import BigNumber from "bignumber.js";

export const formatPercentage = (num: number) => {
  return `${(num * 100).toFixed(2)}%`;
};

export const formatAmount = (amount: BigNumber) => {
  if (amount.isLessThan(1000)) {
    return amount.toFormat(2);
  }
  return amount.integerValue().toFormat();
};

export const formatAssetPrice = (price: number) => {
  if (price < 1) {
    return "$" + BigNumber(price).toFormat(4);
  }
  return "$" + BigNumber(price).toFormat(2);
};

export const calculateValueinUSD = (amount: BigNumber, price: number) => {
  return amount.multipliedBy(price);
};

export const formatPoolValue = (amount: BigNumber) => {
  if (amount.isGreaterThan(10000000)) {
    return `$${amount.dividedBy(1000000).toFormat(1)}M`;
  }
  if (amount.isGreaterThan(1000000)) {
    return `$${amount.dividedBy(1000000).toFormat(2)}M`;
  }
  if (amount.isGreaterThan(100000)) {
    return `$${amount.dividedBy(1000).toFormat(0)}K`;
  }
  if (amount.isGreaterThan(10000)) {
    return `$${amount.dividedBy(1000).toFormat(1)}K`;
  }
  if (amount.isGreaterThan(1000)) {
    return `$${amount.dividedBy(1000).toFormat(2)}K`;
  }
  return `$${amount.toFormat(2)}`;
};
