/// <reference types="node" />
import { Connection, PublicKey } from "@solana/web3.js";
import { RateLimiter } from "../../state/rateLimiter";
import BigNumber from "bignumber.js";
export declare const OUTFLOW_BUFFER = 0.985;
export declare const parseRateLimiter: (rateLimiter: RateLimiter, currentSlot: number) => {
    remainingOutflow: BigNumber | null;
    config: {
        windowDuration: BigNumber;
        maxOutflow: BigNumber;
    };
    windowStart: BigNumber;
    previousQuantity: BigNumber;
    currentQuantity: BigNumber;
};
export declare const remainingOutflow: (currentSlot: number, rateLimiter: {
    config: {
        windowDuration: BigNumber;
        maxOutflow: BigNumber;
    };
    windowStart: BigNumber;
    previousQuantity: BigNumber;
    currentQuantity: BigNumber;
}) => BigNumber | null;
export declare const formatAddress: (address: string, length?: number | undefined) => string;
export declare const titleCase: (name: string) => string;
export declare function getBatchMultipleAccountsInfo(addresses: Array<string | PublicKey>, connection: Connection): Promise<(import("@solana/web3.js").AccountInfo<Buffer> | null)[]>;
export declare function createObligationAddress(publicKey: string, marketAddress: string, programId: string): Promise<string>;
export declare function formatErrorMsg(errorMessage: string): string;
