import BigNumber from 'bignumber.js';
import { Obligation } from 'models/layouts/obligation';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
export declare const RISKY_OBLIGATION_THRESHOLD = 78;
export declare function calculateRefreshedObligation(obligation: Obligation, reserves: any, tokensOracle: any): {
    depositedValue: BigNumber;
    borrowedValue: BigNumber;
    allowedBorrowValue: BigNumber;
    unhealthyBorrowValue: BigNumber;
    deposits: Deposit[];
    borrows: Borrow[];
    utilizationRatio: number;
};
declare type Borrow = {
    borrowReserve: PublicKey;
    borrowAmountWads: BN;
    marketValue: BigNumber;
    mintAddress: string;
    symbol: string;
};
declare type Deposit = {
    depositReserve: PublicKey;
    depositAmount: BN;
    marketValue: BigNumber;
    symbol: string;
};
export {};
