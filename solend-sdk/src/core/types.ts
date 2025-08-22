import { Cluster, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { ReserveType } from "./utils";
import BN from "bn.js";

/**
 * Represents a liquidity token in a reserve.
 */
export type LiquidityToken = {
  coingeckoID: string;
  decimals: number;
  logo: string;
  mint: string;
  name: string;
  symbol: string;
  volume24h: number;
  token2022Mint?: string;
};

/**
 * Represents the configuration of a reserve.
 */
export type ReserveConfig = {
  liquidityToken: LiquidityToken;
  pythOracle: string;
  extraOracle: string;
  switchboardOracle: string;
  address: string;
  collateralMintAddress: string;
  collateralSupplyAddress: string;
  liquidityAddress: string;
  liquidityFeeReceiverAddress: string;
};

/**
 * Represents the configuration of a lending market.
 */
export type MarketConfig = {
  name: string;
  isPrimary: boolean;
  isPermissionless: boolean;
  isCustom?: boolean;
  description: string;
  creator: string;
  owner: string;
  address: string;
  hidden: boolean;
  authorityAddress: string;
  reserves: Array<ReserveConfig>;
  lookupTableAddress?: string;
};

/**
 * Represents the configuration of all lending markets.
 */
export type Config = Array<MarketConfig>;

/**
 * Represents the core metadata of a pool.
 */
export type PoolMetadataCoreType = {
  name: string | null;
  address: string;
  owner: string;
  authorityAddress: string;
  reserves: Array<{
    name: string;
    logo: string;
    mintAddress: string;
    address: string;
  }>;
};

/**
 * The environment to use for the SDK.
 */
export type EnvironmentType = Cluster | "production" | "beta" | "eclipse";

/**
 * Represents the metadata of a token.
 */
export type TokenMetadata = {
  [mintAddress: string]: {
    symbol: string;
    logoUri: string | undefined;
    decimals: number;
    underlyingToken?: string;
  };
};

/**
 * Represents a lending pool.
 */
export type PoolType = {
  name: string | null;
  address: string;
  authorityAddress: string;
  owner: string;
  reserves: Array<ReserveType>;
};

/**
 * Represents a wallet asset.
 */
export type WalletAssetType = {
  amount: BigNumber;
  mintAddress: string;
  symbol: string;
  decimals: number;
  address: string;
  logo?: string;
  underlyingToken?: string;
  wrapped?: boolean;
  wrapper?: boolean;
};

/**
 * Represents a user's wallet.
 */
export type WalletType = Array<WalletAssetType>;

/**
 * Represents the parameters for configuring a reserve.
 */
export type InputReserveConfigParams = {
  optimalUtilizationRate: number;
  maxUtilizationRate: number;
  loanToValueRatio: number;
  liquidationBonus: number;
  liquidationThreshold: number;
  minBorrowRate: number;
  optimalBorrowRate: number;
  maxBorrowRate: number;
  superMaxBorrowRate: BN;
  fees: {
    borrowFeeWad: BN;
    flashLoanFeeWad: BN;
    hostFeePercentage: number;
  };
  depositLimit: BN;
  borrowLimit: BN;
  feeReceiver: PublicKey;
  protocolLiquidationFee: number;
  protocolTakeRate: number;
  addedBorrowWeightBPS: BN;
  reserveType: number;
  maxLiquidationBonus: number;
  maxLiquidationThreshold: number;
  scaledPriceOffsetBPS: BN;
  extraOracle?: PublicKey;
  attributedBorrowLimitOpen: BN;
  attributedBorrowLimitClose: BN;
};
