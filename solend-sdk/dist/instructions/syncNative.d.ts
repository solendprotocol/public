import { PublicKey, TransactionInstruction } from "@solana/web3.js";
/**
 * Construct a SyncNative instruction
 *
 * @param account   Native account to sync lamports from
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function syncNative(account: PublicKey, programId?: PublicKey): TransactionInstruction;
