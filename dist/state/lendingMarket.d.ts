/// <reference types="node" />
import { AccountInfo, PublicKey } from '@solana/web3.js';
import * as BufferLayout from 'buffer-layout';
export interface LendingMarket {
    version: number;
    isInitialized: boolean;
    quoteTokenMint: PublicKey;
    tokenProgramId: PublicKey;
}
export declare const LendingMarketLayout: typeof BufferLayout.Structure;
export declare const LENDING_MARKET_SIZE: any;
export declare const isLendingMarket: (info: AccountInfo<Buffer>) => boolean;
export declare const parseLendingMarket: (pubkey: PublicKey, info: AccountInfo<Buffer>) => {
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
