import { Account, Connection } from '@solana/web3.js';
import { MarketConfig } from 'global';
export declare const liquidateAndRedeem: (connection: Connection, payer: Account, liquidityAmount: number | string, repayTokenSymbol: string, withdrawTokenSymbol: string, lendingMarket: MarketConfig, obligation: any) => Promise<void>;
