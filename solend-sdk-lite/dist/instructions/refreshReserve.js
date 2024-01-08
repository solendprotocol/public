"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshReserveInstruction = void 0;
const web3_js_1 = require("@solana/web3.js");
const instruction_1 = require("./instruction");
const BufferLayout = require("buffer-layout");
/// Accrue interest and update market price of liquidity on a reserve.
///
/// Accounts expected by this instruction:
///
///   0. `[writable]` Reserve account.
///   1. `[]` Clock sysvar.
///   2. `[optional]` Reserve liquidity oracle account.
///                     Required if the reserve currency is not the lending market quote
///                     currency.
const refreshReserveInstruction = (reserve, solendProgramAddress, oracle, switchboardFeedAddress) => {
    const dataLayout = BufferLayout.struct([BufferLayout.u8("instruction")]);
    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({ instruction: instruction_1.LendingInstruction.RefreshReserve }, data);
    const keys = [{ pubkey: reserve, isSigner: false, isWritable: true }];
    if (oracle) {
        keys.push({ pubkey: oracle, isSigner: false, isWritable: false });
    }
    if (switchboardFeedAddress) {
        keys.push({
            pubkey: switchboardFeedAddress,
            isSigner: false,
            isWritable: false,
        });
    }
    return new web3_js_1.TransactionInstruction({
        keys,
        programId: solendProgramAddress,
        data,
    });
};
exports.refreshReserveInstruction = refreshReserveInstruction;
