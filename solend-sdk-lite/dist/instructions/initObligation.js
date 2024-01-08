"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initObligationInstruction = void 0;
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const instruction_1 = require("./instruction");
const BufferLayout = require("buffer-layout");
/// Initializes a new lending market obligation.
///
/// Accounts expected by this instruction:
///
///   0. `[writable]` Obligation account - uninitialized.
///   1. `[]` Lending market account.
///   2. `[signer]` Obligation owner.
///   3. `[]` Clock sysvar.
///   4. `[]` Rent sysvar.
///   5. `[]` Token program id.
const initObligationInstruction = (obligation, lendingMarket, obligationOwner, solendProgramAddress) => {
    const dataLayout = BufferLayout.struct([BufferLayout.u8("instruction")]);
    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({ instruction: instruction_1.LendingInstruction.InitObligation }, data);
    const keys = [
        { pubkey: obligation, isSigner: false, isWritable: true },
        { pubkey: lendingMarket, isSigner: false, isWritable: false },
        { pubkey: obligationOwner, isSigner: true, isWritable: false },
        { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];
    return new web3_js_1.TransactionInstruction({
        keys,
        programId: solendProgramAddress,
        data,
    });
};
exports.initObligationInstruction = initObligationInstruction;
