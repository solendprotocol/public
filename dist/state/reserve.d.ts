/// <reference types="node" />
import { AccountInfo, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import * as BufferLayout from 'buffer-layout';
import { LastUpdate } from './lastUpdate';
export interface Reserve {
    version: number;
    lastUpdate: LastUpdate;
    lendingMarket: PublicKey;
    liquidity: ReserveLiquidity;
    collateral: ReserveCollateral;
    config: ReserveConfig;
}
export interface ReserveLiquidity {
    mintPubkey: PublicKey;
    mintDecimals: number;
    supplyPubkey: PublicKey;
    oracleOption: number;
    pythOraclePubkey: PublicKey;
    switchboardOraclePubkey: PublicKey;
    availableAmount: BN;
    borrowedAmountWads: BN;
    cumulativeBorrowRateWads: BN;
    marketPrice: BN;
}
export interface ReserveCollateral {
    mintPubkey: PublicKey;
    mintTotalSupply: BN;
    supplyPubkey: PublicKey;
}
export interface ReserveConfig {
    optimalUtilizationRate: number;
    loanToValueRatio: number;
    liquidationBonus: number;
    liquidationThreshold: number;
    minBorrowRate: number;
    optimalBorrowRate: number;
    maxBorrowRate: number;
    fees: {
        borrowFeeWad: BN;
        hostFeePercentage: number;
    };
    depositLimit: BN;
}
export declare const ReserveLayout: typeof BufferLayout.Structure;
export declare const RESERVE_SIZE: any;
export declare const isReserve: (info: AccountInfo<Buffer>) => boolean;
export declare const ReserveParser: (pubkey: PublicKey, info: AccountInfo<Buffer>) => {
    pubkey: PublicKey;
    account: {
        executable: boolean;
        owner: PublicKey;
        lamports: number;
        data: Buffer;
        rentEpoch?: number | undefined;
    };
    info: Reserve;
} | null;
export declare function reserveToString(reserve: Reserve): string;
