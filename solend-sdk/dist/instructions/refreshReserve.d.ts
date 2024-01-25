/// <reference types="@project-serum/anchor/node_modules/@solana/web3.js" />
/// <reference types="@pythnetwork/client/node_modules/@solana/web3.js" />
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
export declare const refreshReserveInstruction: (reserve: PublicKey, solendProgramAddress: PublicKey, oracle?: PublicKey, switchboardFeedAddress?: PublicKey) => TransactionInstruction;
