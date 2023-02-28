import { Cluster } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { formatReserve } from "./utils/pools";

export type PoolMetadataCoreType = {
  name: string | null;
  address: string;
  owner: string;
  authorityAddress: string;
};

export type EnvironmentType = Cluster | "production" | "beta";

export type TokenMetadata = {
  [mintAddress: string]: {
    symbol: string;
    logoUri: string | null;
    decimals: number;
  };
};

export type PoolType = {
  name: string | null;
  address: string;
  authorityAddress: string;
  reserves: Array<ReserveType>;
};

export type ReserveType = Omit<
  Awaited<ReturnType<typeof formatReserve>>,
  "symbol"
> & {
  symbol: string | undefined;
};

export type WalletAssetType = {
  amount: BigNumber;
  mintAddress: string;
  symbol: string;
  decimals: number;
  address: string;
};

export type WalletType = Array<WalletAssetType>;
