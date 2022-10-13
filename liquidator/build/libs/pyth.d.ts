import { Connection } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { MarketConfig } from 'global';
export declare type TokenOracleData = {
    symbol: string;
    reserveAddress: string;
    mintAddress: string;
    decimals: BigNumber;
    price: BigNumber;
};
export declare function getTokensOracleData(connection: Connection, market: MarketConfig): Promise<any[]>;
