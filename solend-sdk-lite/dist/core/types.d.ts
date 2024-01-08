import { Cluster } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { formatReserve } from "./utils/pools";
import { formatObligation } from "./utils";
export declare type PoolMetadataCoreType = {
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
export declare type EnvironmentType = Cluster | "production" | "beta";
export declare type TokenMetadata = {
    [mintAddress: string]: {
        symbol: string;
        logoUri: string | null;
        decimals: number;
    };
};
export declare type PoolType = {
    name: string | null;
    address: string;
    authorityAddress: string;
    owner: string;
    reserves: Array<ReserveType>;
};
export declare type ObligationType = Awaited<ReturnType<typeof formatObligation>>;
export declare type ReserveType = Omit<Awaited<ReturnType<typeof formatReserve>>, "symbol"> & {
    symbol: string | undefined;
};
export declare type WalletAssetType = {
    amount: BigNumber;
    mintAddress: string;
    symbol: string;
    decimals: number;
    address: string;
};
export declare type WalletType = Array<WalletAssetType>;
