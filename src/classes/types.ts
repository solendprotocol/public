export type ConfigType = {
  programID: string;
  assets: AssetType[];
  oracles: OraclesType;
  markets: MarketType[];
};

export type AssetType = {
  name: string;
  symbol: string;
  decimals: number;
  mintAddress: string;
};

export type OraclesType = {
  pythProgramID: string;
  switchboardProgramID: string;
  assets: OracleAssetType[];
};

export type OracleAssetType = {
  asset: string;
  priceAddress: string;
  switchboardFeedAddress: string;
};

export type MarketType = {
  name: string;
  address: string;
  authorityAddress: string;
  reserves: ReserveType[];
};

export type ReserveType = {
  asset: string;
  address: string;
  collateralMintAddress: string;
  collateralSupplyAddress: string;
  liquidityAddress: string;
  liquidityFeeReceiverAddress: string;
  userSupplyCap?: number;
};
