import { Cluster, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { ReserveType } from "./utils";
import BN from "bn.js";

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

export type EnvironmentType = Cluster | "production" | "beta" | "eclipse";

export type TokenMetadata = {
  [mintAddress: string]: {
    symbol: string;
    logoUri: string | undefined;
    decimals: number;
  };
};

export type PoolType = {
  name: string | null;
  address: string;
  authorityAddress: string;
  owner: string;
  reserves: Array<ReserveType>;
};

export type WalletAssetType = {
  amount: BigNumber;
  mintAddress: string;
  symbol: string;
  decimals: number;
  address: string;
  logo?: string;
};

export type WalletType = Array<WalletAssetType>;

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
