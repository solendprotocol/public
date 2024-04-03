import { Cluster } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { formatReserve } from "./utils/pools";
import { TokenInfo, formatObligation } from "./utils";

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

export type EnvironmentType = Cluster | "production" | "beta";

export type TokenMetadata = {
  [mintAddress: string]: TokenInfo;
};

export type PoolType = {
  name: string | null;
  address: string;
  authorityAddress: string;
  owner: string;
  reserves: Array<ReserveType>;
};

export type ObligationType = Awaited<ReturnType<typeof formatObligation>>;

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
