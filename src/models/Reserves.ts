import { PublicKey } from "@solana/web3.js";
import { Reserve } from "@solendprotocol/solend-sdk";

export interface ReserveViewModel {
    address: string;
    tokenSymbol: string;
    logoUri: string;
    priceUSD: string;
    LTV: string;
    totalSupply: string;
    totalSupplyUSD: string;
    totalBorrow: string;
    totalBorrowUSD: string;
    supplyAPY: string | number;
    borrowAPY: string | number;
    supplyAPR: string | number;
    borrowAPR: string | number;
}

export interface ParsedReserve {
    pubkey: PublicKey;
    account: {
        executable: boolean;
        owner: PublicKey;
        lamports: number;
        data: Buffer;
        rentEpoch?: number | undefined;
    };
    info: Reserve;
}