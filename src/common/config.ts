import { Connection } from "@solana/web3.js";
import { getProgramId } from "@solendprotocol/solend-sdk";


export const ENVIRONMENT = process.env.NEXT_PUBLIC_REACT_APP_NETWORK as string || "production";
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_REACT_APP_SOLANA_RPC_HOST as string;
export const CONNECTION = new Connection(RPC_ENDPOINT, "confirmed");
export const PROGRAM_ID = getProgramId(ENVIRONMENT);