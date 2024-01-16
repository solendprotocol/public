"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.depositObligationCollateralInstruction = void 0;
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = __importDefault(require("bn.js"));
const spl_token_1 = require("@solana/spl-token");
const Layout = __importStar(require("../layout"));
const instruction_1 = require("./instruction");
const BufferLayout = require("buffer-layout");
/// Deposit collateral to an obligation. Requires a refreshed reserve.
///
/// Accounts expected by this instruction:
///
///   0. `[writable]` Source collateral token account.
///                     Minted by deposit reserve collateral mint.
///                     $authority can transfer $collateral_amount.
///   1. `[writable]` Destination deposit reserve collateral supply SPL Token account.
///   2. `[]` Deposit reserve account - refreshed.
///   3. `[writable]` Obligation account.
///   4. `[]` Lending market account.
///   5. `[signer]` Obligation owner.
///   6. `[signer]` User transfer authority ($authority).
///   7. `[]` Clock sysvar.
///   8. `[]` Token program id.
const depositObligationCollateralInstruction = (collateralAmount, sourceCollateral, destinationCollateral, depositReserve, obligation, lendingMarket, obligationOwner, transferAuthority, solendProgramAddress) => {
    const dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        Layout.uint64("collateralAmount"),
    ]);
    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: instruction_1.LendingInstruction.DepositObligationCollateral,
        collateralAmount: new bn_js_1.default(collateralAmount),
    }, data);
    const keys = [
        { pubkey: sourceCollateral, isSigner: false, isWritable: true },
        { pubkey: destinationCollateral, isSigner: false, isWritable: true },
        { pubkey: depositReserve, isSigner: false, isWritable: false },
        { pubkey: obligation, isSigner: false, isWritable: true },
        { pubkey: lendingMarket, isSigner: false, isWritable: false },
        { pubkey: obligationOwner, isSigner: true, isWritable: false },
        { pubkey: transferAuthority, isSigner: true, isWritable: false },
        { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];
    return new web3_js_1.TransactionInstruction({
        keys,
        programId: solendProgramAddress,
        data,
    });
};
exports.depositObligationCollateralInstruction = depositObligationCollateralInstruction;
