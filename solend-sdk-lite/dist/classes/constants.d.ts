import { Cluster, PublicKey } from "@solana/web3.js";
export declare const U64_MAX = "18446744073709551615";
export declare const NULL_ORACLE: PublicKey;
export declare const SOLEND_PRODUCTION_PROGRAM_ID: PublicKey;
export declare const SOLEND_DEVNET_PROGRAM_ID: PublicKey;
export declare const SOLEND_BETA_PROGRAM_ID: PublicKey;
export declare function getProgramId(
  environment?: Cluster | "beta" | "production"
): PublicKey;
