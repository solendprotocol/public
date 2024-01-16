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
exports.updateMetadataInstruction = void 0;
const anchor = __importStar(require("@coral-xyz/anchor"));
const web3_js_1 = require("@solana/web3.js");
const pubkey_1 = require("@project-serum/anchor/dist/cjs/utils/pubkey");
const instruction_1 = require("./instruction");
const BufferLayout = require("buffer-layout");
const updateMetadataInstruction = (lendingMarket, lendingMarketOwner, lendingProgramId, marketName, marketDescription, marketImageUrl) => {
    const dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        BufferLayout.blob(50, "marketName"),
        BufferLayout.blob(250, "marketDescription"),
        BufferLayout.blob(250, "marketImageUrl"),
        BufferLayout.blob(200, "padding"),
        BufferLayout.u8("bumpSeed"),
    ]);
    const [lendingMarketMetadata, _] = (0, pubkey_1.findProgramAddressSync)([
        lendingMarket.toBytes(),
        Buffer.from(anchor.utils.bytes.utf8.encode("MetaData")),
    ], lendingProgramId);
    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: instruction_1.LendingInstruction.UpdateMetadata,
        marketName,
        marketDescription,
        marketImageUrl,
        padding: Buffer.alloc(200),
    }, data);
    const keys = [
        { pubkey: lendingMarket, isSigner: false, isWritable: false },
        { pubkey: lendingMarketOwner, isSigner: true, isWritable: false },
        { pubkey: lendingMarketMetadata, isSigner: false, isWritable: true },
        { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
    ];
    return new web3_js_1.TransactionInstruction({
        keys,
        programId: lendingProgramId,
        data,
    });
};
exports.updateMetadataInstruction = updateMetadataInstruction;
