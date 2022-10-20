import BN from "bn.js";

export type RewardInfoType = {
  rewardRate: string;
  rewardMint?: string;
  rewardSymbol: string;
  price: number;
};

export type RewardsDataType = {
  [key: string]: {
    supply: Array<RewardInfoType>;
    borrow: Array<RewardInfoType>;
  };
};

export type RewardResponseType = {
  supply: RewardStatType;
  borrow: RewardStatType;
};

export type RewardStatType = {
  rewardsPerShare: string;
  totalBalance: string;
  lastSlot: number;
  rewardRates: Array<{
    beginningSlot: number;
    rewardRate: string;
    name?: string;
  }>;
} | null;

export type ExternalRewardStatType = RewardStatType & {
  rewardMint: string;
  rewardSymbol: string;
  reserveID: string;
  side: "supply" | "borrow";
};

export type ConfigType = Array<MarketConfigType>;

export type ReserveConfigType = {
  liquidityToken: {
    coingeckoID: string;
    decimals: number;
    logo: string;
    mint: string;
    name: string;
    symbol: string;
    volume24h: number;
  };
  pythOracle: string;
  switchboardOracle: string;
  address: string;
  collateralMintAddress: string;
  collateralSupplyAddress: string;
  liquidityAddress: string;
  liquidityFeeReceiverAddress: string;
  userSupplyCap: number;
  userBorrowCap: number;
};

export type MarketConfigType = {
  name: string;
  isPrimary: boolean;
  description: string;
  creator: string;
  address: string;
  hidden: boolean;
  authorityAddress: string;
  reserves: Array<ReserveConfigType>;
};

export type ReserveDataType = {
  optimalUtilizationRate: number;
  loanToValueRatio: number;
  liquidationBonus: number;
  liquidationThreshold: number;
  minBorrowRate: number;
  optimalBorrowRate: number;
  maxBorrowRate: number;
  borrowFeePercentage: number;
  flashLoanFeePercentage: number;
  hostFeePercentage: number;
  depositLimit: BN;
  reserveBorrowLimit: BN;
  name: string;
  symbol: string;
  decimals: number;
  mintAddress: string;
  totalDepositsWads: BN;
  totalBorrowsWads: BN;
  totalLiquidityWads: BN;
  supplyInterestAPY: number;
  borrowInterestAPY: number;
  assetPriceUSD: number;
  protocolTakeRate: number;
  userDepositLimit?: number;
  cumulativeBorrowRateWads: BN;
  cTokenExchangeRate: number;
};
