/// <reference types="node" />
import { AccountInfo, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { Buffer } from "buffer";
import { RateLimiter } from "./rateLimiter";
import { LastUpdate } from "./lastUpdate";
declare const BufferLayout: any;
export interface Reserve {
    version: number;
    lastUpdate: LastUpdate;
    lendingMarket: PublicKey;
    liquidity: ReserveLiquidity;
    collateral: ReserveCollateral;
    config: ReserveConfig;
    rateLimiter: RateLimiter;
}
export interface ReserveLiquidity {
    mintPubkey: PublicKey;
    mintDecimals: number;
    supplyPubkey: PublicKey;
    oracleOption: number;
    pythOracle: PublicKey;
    switchboardOracle: PublicKey;
    availableAmount: BN;
    borrowedAmountWads: BN;
    cumulativeBorrowRateWads: BN;
    accumulatedProtocolFeesWads: BN;
    marketPrice: BN;
    smoothedMarketPrice: BN;
}
export interface ReserveCollateral {
    mintPubkey: PublicKey;
    mintTotalSupply: BN;
    supplyPubkey: PublicKey;
}
export interface ReserveConfig {
    optimalUtilizationRate: number;
    maxUtilizationRate: number;
    loanToValueRatio: number;
    liquidationBonus: number;
    maxLiquidationBonus: number;
    liquidationThreshold: number;
    maxLiquidationThreshold: number;
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
    borrowWeight: number;
    reserveType: AssetType;
}
export declare enum AssetType {
    Regular = 0,
    Isolated = 1
}
export declare const ReserveConfigLayout: any;
export declare const ReserveLayout: typeof BufferLayout.Structure;
export declare const RESERVE_SIZE: any;
export declare const isReserve: (info: AccountInfo<Buffer>) => boolean;
export declare const parseReserve: (pubkey: PublicKey, info: AccountInfo<Buffer>, encoding?: string) => {
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
export {};
