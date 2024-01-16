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
exports.initReserveInstruction = void 0;
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = __importDefault(require("bn.js"));
const Layout = __importStar(require("../layout"));
const instruction_1 = require("./instruction");
const BufferLayout = require("buffer-layout");
const initReserveInstruction = (liquidityAmount, config, sourceLiquidity, destinationCollateral, reserve, liquidityMint, liquiditySupply, liquidityFeeReceiver, collateralMint, collateralSupply, pythProduct, pythPrice, switchboardFeed, lendingMarket, lendingMarketAuthority, lendingMarketOwner, transferAuthority, lendingProgramId) => {
    const dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        Layout.uint64("liquidityAmount"),
        BufferLayout.u8("optimalUtilizationRate"),
        BufferLayout.u8("maxUtilizationRate"),
        BufferLayout.u8("loanToValueRatio"),
        BufferLayout.u8("liquidationBonus"),
        BufferLayout.u8("liquidationThreshold"),
        BufferLayout.u8("minBorrowRate"),
        BufferLayout.u8("optimalBorrowRate"),
        BufferLayout.u8("maxBorrowRate"),
        Layout.uint64("superMaxBorrowRate"),
        Layout.uint64("borrowFeeWad"),
        Layout.uint64("flashLoanFeeWad"),
        BufferLayout.u8("hostFeePercentage"),
        Layout.uint64("depositLimit"),
        Layout.uint64("borrowLimit"),
        Layout.publicKey("feeReceiver"),
        BufferLayout.u8("protocolLiquidationFee"),
        BufferLayout.u8("protocolTakeRate"),
        Layout.uint64("addedBorrowWeightBPS"),
        BufferLayout.u8("reserveType"),
        BufferLayout.u8("maxLiquidationBonus"),
        BufferLayout.u8("maxLiquidationThreshold"),
    ]);
    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: instruction_1.LendingInstruction.InitReserve,
        liquidityAmount: new bn_js_1.default(liquidityAmount),
        optimalUtilizationRate: config.optimalUtilizationRate,
        maxUtilizationRate: config.maxUtilizationRate,
        loanToValueRatio: config.loanToValueRatio,
        liquidationBonus: config.liquidationBonus,
        liquidationThreshold: config.liquidationThreshold,
        minBorrowRate: config.minBorrowRate,
        optimalBorrowRate: config.optimalBorrowRate,
        maxBorrowRate: config.maxBorrowRate,
        superMaxBorrowRate: config.superMaxBorrowRate,
        borrowFeeWad: config.fees.borrowFeeWad,
        flashLoanFeeWad: config.fees.flashLoanFeeWad,
        hostFeePercentage: config.fees.hostFeePercentage,
        depositLimit: config.depositLimit,
        borrowLimit: config.borrowLimit,
        feeReceiver: config.feeReceiver,
        protocolLiquidationFee: config.protocolLiquidationFee,
        protocolTakeRate: config.protocolTakeRate,
        addedBorrowWeightBPS: config.addedBorrowWeightBPS,
        reserveType: config.reserveType,
        maxLiquidationBonus: config.maxLiquidationBonus,
        maxLiquidationThreshold: config.maxLiquidationThreshold,
    }, data);
    const keys = [
        { pubkey: sourceLiquidity, isSigner: false, isWritable: true },
        { pubkey: destinationCollateral, isSigner: false, isWritable: true },
        { pubkey: reserve, isSigner: false, isWritable: true },
        { pubkey: liquidityMint, isSigner: false, isWritable: false },
        { pubkey: liquiditySupply, isSigner: false, isWritable: true },
        { pubkey: liquidityFeeReceiver, isSigner: false, isWritable: true },
        { pubkey: collateralMint, isSigner: false, isWritable: true },
        { pubkey: collateralSupply, isSigner: false, isWritable: true },
        { pubkey: pythProduct, isSigner: false, isWritable: false },
        { pubkey: pythPrice, isSigner: false, isWritable: false },
        { pubkey: switchboardFeed, isSigner: false, isWritable: false },
        { pubkey: lendingMarket, isSigner: false, isWritable: true },
        { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
        { pubkey: lendingMarketOwner, isSigner: true, isWritable: false },
        { pubkey: transferAuthority, isSigner: true, isWritable: false },
        { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];
    return new web3_js_1.TransactionInstruction({
        keys,
        programId: lendingProgramId,
        data,
    });
};
exports.initReserveInstruction = initReserveInstruction;
