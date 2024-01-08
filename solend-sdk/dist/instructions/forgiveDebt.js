"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.forgiveDebtInstruction = void 0;
const web3_js_1 = require("@solana/web3.js");
const BufferLayout = __importStar(require("buffer-layout"));
const Layout = __importStar(require("../layout"));
const instruction_1 = require("./instruction");
const bn_js_1 = __importDefault(require("bn.js"));
const forgiveDebtInstruction = (obligation, reserve, lendingMarket, lendingMarketOwner, liquidityAmount, lendingProgramId) => {
    const dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        Layout.uint64("liquidityAmount"),
    ]);
    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: instruction_1.LendingInstruction.ForgiveDebt,
        liquidityAmount: new bn_js_1.default(liquidityAmount),
    }, data);
    const keys = [
        { pubkey: obligation, isSigner: false, isWritable: true },
        { pubkey: reserve, isSigner: false, isWritable: true },
        { pubkey: lendingMarket, isSigner: false, isWritable: false },
        { pubkey: lendingMarketOwner, isSigner: true, isWritable: false },
    ];
    return new web3_js_1.TransactionInstruction({
        keys,
        programId: lendingProgramId,
        data,
    });
};
exports.forgiveDebtInstruction = forgiveDebtInstruction;
