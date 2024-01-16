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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setLendingMarketOwnerAndConfigInstruction = void 0;
const web3_js_1 = require("@solana/web3.js");
const BufferLayout = __importStar(require("buffer-layout"));
const Layout = __importStar(require("../layout"));
const instruction_1 = require("./instruction");
/// Sets the new owner of a lending market.
///
/// Accounts expected by this instruction:
///
///   0. `[writable]` Lending market account.
///   1. `[signer]` Current owner.
const setLendingMarketOwnerAndConfigInstruction = (lendingMarket, currentMarketOwner, newMarketOwner, newRateLimiterConfig, riskAuthority, lendingProgramId, whitelistedLiquidator) => {
    const dataAccounts = [
        BufferLayout.u8("instruction"),
        Layout.publicKey("newOwner"),
        Layout.uint64("windowDuration"),
        Layout.uint64("maxOutflow"),
        BufferLayout.u8("whitelistedLiquidator"),
        Layout.publicKey("riskAuthority"),
    ];
    if (whitelistedLiquidator) {
        dataAccounts.splice(5, 0, Layout.publicKey("whitelistedLiquidatorPublicKey"));
    }
    const dataLayout = BufferLayout.struct(dataAccounts);
    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: instruction_1.LendingInstruction.SetLendingMarketOwnerAndConfig,
        newOwner: newMarketOwner,
        windowDuration: newRateLimiterConfig.windowDuration,
        maxOutflow: newRateLimiterConfig.maxOutflow,
        whitelistedLiquidator: Number(Boolean(whitelistedLiquidator)),
        whitelistedLiquidatorPublicKey: whitelistedLiquidator,
        riskAuthority: riskAuthority,
    }, data);
    const keys = [
        { pubkey: lendingMarket, isSigner: false, isWritable: true },
        { pubkey: currentMarketOwner, isSigner: true, isWritable: false },
    ];
    return new web3_js_1.TransactionInstruction({
        keys,
        programId: lendingProgramId,
        data,
    });
};
exports.setLendingMarketOwnerAndConfigInstruction = setLendingMarketOwnerAndConfigInstruction;
