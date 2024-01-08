"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncNative = void 0;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const instruction_1 = require("./instruction");
const BufferLayout = require("buffer-layout");
const dataLayout = BufferLayout.struct([BufferLayout.u8("instruction")]);
/**
 * Construct a SyncNative instruction
 *
 * @param account   Native account to sync lamports from
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function syncNative(account, programId = spl_token_1.TOKEN_PROGRAM_ID) {
    const keys = [{ pubkey: account, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({ instruction: instruction_1.TokenInstruction.SyncNative }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
exports.syncNative = syncNative;
