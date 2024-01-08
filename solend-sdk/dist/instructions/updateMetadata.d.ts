import { PublicKey, TransactionInstruction } from "@solana/web3.js";
export declare const updateMetadataInstruction: (lendingMarket: PublicKey, lendingMarketOwner: PublicKey, lendingProgramId: PublicKey, marketName: string, marketDescription: string, marketImageUrl: string) => TransactionInstruction;
