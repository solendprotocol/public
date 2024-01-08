import { PublicKey, TransactionInstruction } from "@solana/web3.js";
export declare const refreshObligationInstruction: (obligation: PublicKey, depositReserves: PublicKey[], borrowReserves: PublicKey[], solendProgramAddress: PublicKey) => TransactionInstruction;
