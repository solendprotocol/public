/// <reference types="node" />
import { Connection, PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { MarketConfig, TokenCount } from 'global';
export declare const WAD: BigNumber;
export declare const U64_MAX = "18446744073709551615";
export declare function toHuman(market: MarketConfig, amount: string, symbol: string): string;
export declare function toBaseUnit(market: MarketConfig, amount: string, symbol: string): string;
export declare function getTokenInfo(market: MarketConfig, symbol: string): any;
export declare function getTokenInfoFromMarket(market: MarketConfig, symbol: string): {
    name: string;
    symbol: string;
    decimals: number;
    mintAddress: string;
    logo: string;
};
export declare function wait(ms: number): Promise<unknown>;
export declare function getProgramIdForCurrentDeployment(): string;
export declare function getObligations(connection: Connection, lendingMarketAddr: any): Promise<({
    pubkey: PublicKey;
    account: {
        executable: boolean;
        owner: PublicKey;
        lamports: number;
        data: Buffer;
        rentEpoch?: number | undefined;
    };
    info: import("models/layouts/obligation").Obligation;
} | null)[]>;
export declare function getReserves(connection: Connection, lendingMarketAddr: any): Promise<({
    pubkey: PublicKey;
    account: {
        executable: boolean;
        owner: PublicKey;
        lamports: number;
        data: Buffer;
        rentEpoch?: number | undefined;
    };
    info: import("models/layouts/reserve").Reserve;
} | null)[]>;
export declare function getWalletBalances(connection: any, wallet: any, tokensOracle: any, market: any): Promise<any[]>;
export declare function getWalletTokenData(connection: Connection, market: MarketConfig, wallet: any, mintAddress: any, symbol: any): Promise<{
    balance: number;
    balanceBase: number;
    symbol: any;
}>;
export declare const findAssociatedTokenAddress: (walletAddress: PublicKey, tokenMintAddress: PublicKey) => Promise<PublicKey>;
export declare const getWalletBalance: (connection: Connection, mint: PublicKey, walletAddress: PublicKey) => Promise<number>;
export declare function getWalletDistTarget(): TokenCount[];
