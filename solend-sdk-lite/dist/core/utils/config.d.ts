import { Connection, PublicKey } from "@solana/web3.js";
import { EnvironmentType, PoolMetadataCoreType } from "../types";
export declare function fetchPoolMetadata(connection: Connection, environment?: EnvironmentType, useApi?: Boolean, debug?: Boolean): Promise<Array<PoolMetadataCoreType>>;
export declare const fetchPoolMetadataFromChain: (connection: Connection, programId: PublicKey, debug?: Boolean | undefined) => Promise<{
    name: null;
    owner: string;
    authorityAddress: string;
    address: string;
    reserves: never[];
}[]>;
