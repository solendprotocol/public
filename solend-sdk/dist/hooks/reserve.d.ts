import { Connection } from "@solana/web3.js";
import { ReserveType } from "../core";
export declare function useReserve(connection: Connection, reserveAddress: string | null): ReserveType | null | undefined;
