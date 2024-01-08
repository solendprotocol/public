import { Connection, PublicKey } from "@solana/web3.js";
import SwitchboardProgram from "@switchboard-xyz/sbv2-lite";
import { Reserve } from "../../state";
export declare function fetchPrices(parsedReserves: Array<{
    info: Reserve;
    pubkey: PublicKey;
}>, connection: Connection, switchboardProgram: SwitchboardProgram, debug?: boolean): Promise<{
    [address: string]: {
        spotPrice: number;
        emaPrice: number;
    } | undefined;
}>;
