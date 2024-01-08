"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshObligationInstruction = void 0;
const web3_js_1 = require("@solana/web3.js");
const buffer_layout_1 = __importDefault(require("buffer-layout"));
const instruction_1 = require("./instruction");
/// Refresh an obligation"s accrued interest and collateral and liquidity prices. Requires
/// refreshed reserves, as all obligation collateral deposit reserves in order, followed by all
/// liquidity borrow reserves in order.
///
/// Accounts expected by this instruction:
///
///   0. `[writable]` Obligation account.
///   1. `[]` Clock sysvar.
///   .. `[]` Collateral deposit reserve accounts - refreshed, all, in order.
///   .. `[]` Liquidity borrow reserve accounts - refreshed, all, in order.
const refreshObligationInstruction = (obligation, depositReserves, borrowReserves, solendProgramAddress) => {
    const dataLayout = buffer_layout_1.default.struct([buffer_layout_1.default.u8("instruction")]);
    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({ instruction: instruction_1.LendingInstruction.RefreshObligation }, data);
    const keys = [{ pubkey: obligation, isSigner: false, isWritable: true }];
    depositReserves.forEach((depositReserve) => keys.push({
        pubkey: depositReserve,
        isSigner: false,
        isWritable: false,
    }));
    borrowReserves.forEach((borrowReserve) => keys.push({
        pubkey: borrowReserve,
        isSigner: false,
        isWritable: false,
    }));
    return new web3_js_1.TransactionInstruction({
        keys,
        programId: solendProgramAddress,
        data,
    });
};
exports.refreshObligationInstruction = refreshObligationInstruction;
