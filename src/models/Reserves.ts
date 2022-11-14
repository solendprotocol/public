import { PublicKey } from "@solana/web3.js";
import { Reserve } from "@solendprotocol/solend-sdk";
import BigNumber from "bignumber.js";

export interface ReserveViewModel {
    address: string;
    tokenSymbol: string;
    logoUri: string;
    assetPriceUSD: string; // ReserveDataType.assetPriceUSD
    totalSupply: BigNumber;
    totalBorrow: BigNumber;
    LTV: number;
    supplyAPY: number;
    borrowAPY: number;
    supplyAPR: number;
    borrowAPR: number;
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