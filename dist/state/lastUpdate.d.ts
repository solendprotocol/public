import BN from 'bn.js';
import * as BufferLayout from 'buffer-layout';
export declare const LastUpdateLayout: typeof BufferLayout.Structure;
export interface LastUpdate {
    slot: BN;
    stale: boolean;
}
