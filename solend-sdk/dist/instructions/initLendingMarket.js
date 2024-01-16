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
exports.initLendingMarketInstruction = void 0;
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const Layout = __importStar(require("../layout"));
const instruction_1 = require("./instruction");
const BufferLayout = require("buffer-layout");
const initLendingMarketInstruction = (owner, quoteCurrency, lendingMarket, lendingProgramId, oracleProgramId, switchboardProgramId) => {
    const dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        Layout.publicKey("owner"),
        BufferLayout.blob(32, "quoteCurrency"),
    ]);
    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: instruction_1.LendingInstruction.InitLendingMarket,
        owner,
        quoteCurrency,
    }, data);
    const keys = [
        { pubkey: lendingMarket, isSigner: false, isWritable: true },
        { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: oracleProgramId, isSigner: false, isWritable: false },
        { pubkey: switchboardProgramId, isSigner: false, isWritable: false },
    ];
    return new web3_js_1.TransactionInstruction({
        keys,
        programId: lendingProgramId,
        data,
    });
};
exports.initLendingMarketInstruction = initLendingMarketInstruction;
