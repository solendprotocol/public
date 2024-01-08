import BN from "bn.js";
declare const BufferLayout: any;
export declare const LastUpdateLayout: typeof BufferLayout.Structure;
export interface LastUpdate {
    slot: BN;
    stale: boolean;
}
export {};
