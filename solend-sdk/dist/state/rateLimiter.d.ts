import BigNumber from "bignumber.js";
import BN from "bn.js";
export declare const RATE_LIMITER_LEN = 56;
export interface RateLimiter {
    config: RateLimiterConfig;
    previousQuantity: BN;
    windowStart: BN;
    currentQuantity: BN;
}
export type ParsedRateLimiter = {
    config: {
        windowDuration: BigNumber;
        maxOutflow: BigNumber;
    };
    windowStart: BigNumber;
    previousQuantity: BigNumber;
    currentQuantity: BigNumber;
    remainingOutflow: BigNumber | null;
};
export interface RateLimiterConfig {
    windowDuration: BN;
    maxOutflow: BN;
}
export declare const RateLimiterLayout: any;
