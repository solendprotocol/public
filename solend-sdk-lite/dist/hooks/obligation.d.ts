/// <reference types="node" />
import { Connection } from "@solana/web3.js";
import { ReserveType } from "../core";
export declare function useObligation(connection: Connection, reserve: ReserveType | null, obligationAddress: string | null): {
    pubkey: import("@solana/web3.js").PublicKey;
    account: {
        executable: boolean;
        owner: import("@solana/web3.js").PublicKey;
        lamports: number;
        data: Buffer;
        rentEpoch?: number | undefined;
    };
    info: import("../state").Obligation;
} | null | undefined;
