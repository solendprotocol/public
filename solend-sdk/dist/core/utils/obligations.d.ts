/// <reference types="node" />
/// <reference types="@project-serum/anchor/node_modules/@solana/web3.js" />
/// <reference types="@pythnetwork/client/node_modules/@solana/web3.js" />
import { Connection, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { Obligation } from "../../state";
import { ReserveType } from "../types";
export type FormattedObligation = ReturnType<typeof formatObligation>;
export declare function formatObligation(obligation: {
    pubkey: PublicKey;
    info: Obligation;
}, pool: {
    reserves: Array<ReserveType>;
}): {
    address: string;
    positions: number;
    deposits: {
        liquidationThreshold: number;
        loanToValueRatio: number;
        symbol: string | undefined;
        price: BigNumber;
        mintAddress: string;
        reserveAddress: string;
        amount: BigNumber;
        amountUsd: BigNumber;
        annualInterest: BigNumber;
    }[];
    borrows: {
        liquidationThreshold: number;
        loanToValueRatio: number;
        symbol: string | undefined;
        price: BigNumber;
        reserveAddress: string;
        mintAddress: string;
        borrowWeight: number;
        amount: BigNumber;
        amountUsd: BigNumber;
        weightedAmountUsd: BigNumber;
        annualInterest: BigNumber;
    }[];
    poolAddress: string;
    totalSupplyValue: BigNumber;
    totalBorrowValue: BigNumber;
    borrowLimit: BigNumber;
    liquidationThreshold: BigNumber;
    netAccountValue: BigNumber;
    liquidationThresholdFactor: BigNumber;
    borrowLimitFactor: BigNumber;
    borrowUtilization: BigNumber;
    weightedConservativeBorrowUtilization: BigNumber;
    weightedBorrowUtilization: BigNumber;
    isBorrowLimitReached: boolean;
    borrowOverSupply: BigNumber;
    weightedTotalBorrowValue: BigNumber;
    minPriceUserTotalSupply: BigNumber;
    minPriceBorrowLimit: BigNumber;
    maxPriceUserTotalWeightedBorrow: BigNumber;
    netApy: BigNumber;
};
export declare function fetchObligationByAddress(obligationAddress: string, connection: Connection, debug?: boolean): Promise<{
    pubkey: PublicKey;
    account: {
        executable: boolean;
        owner: PublicKey;
        lamports: number;
        data: Buffer;
        rentEpoch?: number | undefined;
    };
    info: Obligation;
} | null>;
export declare function fetchObligationsByAddress(obligationAddresses: Array<string>, connection: Connection, debug?: boolean): Promise<{
    info: Obligation;
    pubkey: PublicKey;
}[]>;
export declare function fetchObligationsByWallet(publicKey: PublicKey, connection: Connection, programId: string, debug?: boolean): Promise<{
    info: Obligation;
    pubkey: PublicKey;
}[]>;
export declare function fetchObligationsOfPoolByWallet(publicKey: PublicKey, poolAddress: PublicKey, programId: PublicKey, connection: Connection, debug?: boolean): Promise<{
    info: Obligation;
    pubkey: PublicKey;
}[]>;
export declare function getNthObligationSeed(lendingMarket: PublicKey, n: number): string;
export declare function getObligationAddressWithSeed(publicKey: PublicKey, seed: string, programId: PublicKey): PublicKey;
