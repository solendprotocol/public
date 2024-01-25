/// <reference types="@project-serum/anchor/node_modules/@solana/web3.js" />
/// <reference types="@pythnetwork/client/node_modules/@solana/web3.js" />
import { Connection, PublicKey } from "@solana/web3.js";
import { EnvironmentType, PoolMetadataCoreType } from "../types";
export declare function fetchPoolMetadata(connection: Connection, environment?: EnvironmentType, useApi?: Boolean, debug?: Boolean): Promise<Array<PoolMetadataCoreType>>;
export declare const fetchPoolMetadataFromChain: (connection: Connection, programId: PublicKey, debug?: Boolean) => Promise<{
    name: null;
    owner: string;
    authorityAddress: string;
    address: string;
    reserves: never[];
}[]>;
