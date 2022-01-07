export type Config = {
  programID: string;
  assets: Asset[];
  oracles: Oracles;
  markets: Market[];
};
export type Asset = {
  name: string;
  symbol: string;
  decimals: number;
  mintAddress: string;
};
export type Oracles = {
  pythProgramID: string;
  switchboardProgramID: string;
  assets: OracleAsset[];
};
export type OracleAsset = {
  asset: string;
  priceAddress: string;
  switchboardFeedAddress: string;
};
export type Market = {
  name: string;
  address: string;
  authorityAddress: string;
  reserves: Reserve[];
};
export type Reserve = {
  asset: string;
  address: string;
  collateralMintAddress: string;
  collateralSupplyAddress: string;
  liquidityAddress: string;
  liquidityFeeReceiverAddress: string;
  userSupplyCap?: number;
};
