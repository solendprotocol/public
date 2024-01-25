/// <reference types="@project-serum/anchor/node_modules/@solana/web3.js" />
/// <reference types="@pythnetwork/client/node_modules/@solana/web3.js" />
import { Cluster, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { ObligationType } from "./types";
export declare const WAD: string;
export declare const POSITION_LIMIT = 6;
export declare const SOL_PADDING_FOR_INTEREST = "1000000";
export declare const SLOTS_PER_YEAR = 63072000;
export declare const SOLEND_ADDRESSES: string[];
export declare const U64_MAX = "18446744073709551615";
export declare const NULL_ORACLE: PublicKey;
export declare const SOLEND_PRODUCTION_PROGRAM_ID: PublicKey;
export declare const SOLEND_DEVNET_PROGRAM_ID: PublicKey;
export declare const SOLEND_BETA_PROGRAM_ID: PublicKey;
export declare function getProgramId(environment?: Cluster | "beta" | "production"): PublicKey;
export declare const BigZero: BigNumber;
export declare const EmptyObligation: ObligationType;
