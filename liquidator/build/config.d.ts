import { MarketConfig } from 'global';
export declare const OBLIGATION_LEN = 1300;
export declare const RESERVE_LEN = 619;
export declare const LENDING_MARKET_LEN = 290;
export declare function getMarkets(): Promise<MarketConfig[]>;
export declare const network: string;
