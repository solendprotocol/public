import { PublicKey, TransactionInstruction } from "@solana/web3.js";
export declare const initObligationInstruction: (obligation: PublicKey, lendingMarket: PublicKey, obligationOwner: PublicKey, solendProgramAddress: PublicKey) => TransactionInstruction;
