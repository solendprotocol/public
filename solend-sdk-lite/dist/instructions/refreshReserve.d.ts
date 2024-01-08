import { PublicKey, TransactionInstruction } from "@solana/web3.js";
export declare const refreshReserveInstruction: (reserve: PublicKey, solendProgramAddress: PublicKey, oracle?: PublicKey | undefined, switchboardFeedAddress?: PublicKey | undefined) => TransactionInstruction;
