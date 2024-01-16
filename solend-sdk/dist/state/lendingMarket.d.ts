/// <reference types="node" />
import { AccountInfo, PublicKey } from "@solana/web3.js";
import { RateLimiter } from "./rateLimiter";
declare const BufferLayout: any;
export interface LendingMarket {
    version: number;
    bumpSeed: number;
    owner: PublicKey;
    quoteTokenMint: PublicKey;
    tokenProgramId: PublicKey;
    oracleProgramId: PublicKey;
    switchboardOracleProgramId: PublicKey;
    rateLimiter: RateLimiter;
    whitelistedLiquidator: PublicKey | null;
    riskAuthority: PublicKey;
}
export declare const LendingMarketLayout: typeof BufferLayout.Structure;
export declare const LENDING_MARKET_SIZE: any;
export declare const isLendingMarket: (info: AccountInfo<Buffer>) => boolean;
export declare const parseLendingMarket: (pubkey: PublicKey, info: AccountInfo<Buffer>, encoding?: string) => {
    pubkey: PublicKey;
    account: {
        executable: boolean;
        owner: PublicKey;
        lamports: number;
        data: Buffer;
        rentEpoch?: number | undefined;
    };
    info: LendingMarket;
};
export {};
