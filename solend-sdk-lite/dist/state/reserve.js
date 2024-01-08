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
exports.reserveToString = exports.parseReserve = exports.isReserve = exports.RESERVE_SIZE = exports.ReserveLayout = exports.ReserveConfigLayout = exports.AssetType = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const bn_js_1 = __importDefault(require("bn.js"));
const buffer_1 = require("buffer");
const fzstd = __importStar(require("fzstd"));
const rateLimiter_1 = require("./rateLimiter");
const Layout = __importStar(require("../layout"));
const lastUpdate_1 = require("./lastUpdate");
const BufferLayout = require("buffer-layout");
var AssetType;
(function (AssetType) {
    AssetType[AssetType["Regular"] = 0] = "Regular";
    AssetType[AssetType["Isolated"] = 1] = "Isolated";
})(AssetType = exports.AssetType || (exports.AssetType = {}));
exports.ReserveConfigLayout = BufferLayout.struct([
    BufferLayout.u8("optimalUtilizationRate"),
    BufferLayout.u8("maxUtilizationRate"),
    BufferLayout.u8("loanToValueRatio"),
    BufferLayout.u8("liquidationBonus"),
    BufferLayout.u8("maxLiquidationBonus"),
    BufferLayout.u8("liquidationThreshold"),
    BufferLayout.u8("maxLiquidationThreshold"),
    BufferLayout.u8("minBorrowRate"),
    BufferLayout.u8("optimalBorrowRate"),
    BufferLayout.u8("maxBorrowRate"),
    BufferLayout.u8("superMaxBorrowRate"),
    BufferLayout.struct([
        Layout.uint64("borrowFeeWad"),
        Layout.uint64("flashLoanFeeWad"),
        BufferLayout.u8("hostFeePercentage"),
    ], "fees"),
    Layout.uint64("depositLimit"),
    Layout.uint64("borrowLimit"),
    Layout.publicKey("feeReceiver"),
    BufferLayout.u8("protocolLiquidationFee"),
    BufferLayout.u8("protocolTakeRate"),
    Layout.uint64("addedBorrowWeightBPS"),
    BufferLayout.u8("reserveType"),
], "config");
exports.ReserveLayout = BufferLayout.struct([
    BufferLayout.u8("version"),
    lastUpdate_1.LastUpdateLayout,
    Layout.publicKey("lendingMarket"),
    Layout.publicKey("liquidityMintPubkey"),
    BufferLayout.u8("liquidityMintDecimals"),
    Layout.publicKey("liquiditySupplyPubkey"),
    // @FIXME: oracle option
    // TODO: replace u32 option with generic equivalent
    // BufferLayout.u32('oracleOption'),
    Layout.publicKey("liquidityPythOracle"),
    Layout.publicKey("liquiditySwitchboardOracle"),
    Layout.uint64("liquidityAvailableAmount"),
    Layout.uint128("liquidityBorrowedAmountWads"),
    Layout.uint128("liquidityCumulativeBorrowRateWads"),
    Layout.uint128("liquidityMarketPrice"),
    Layout.publicKey("collateralMintPubkey"),
    Layout.uint64("collateralMintTotalSupply"),
    Layout.publicKey("collateralSupplyPubkey"),
    BufferLayout.u8("optimalUtilizationRate"),
    BufferLayout.u8("loanToValueRatio"),
    BufferLayout.u8("liquidationBonus"),
    BufferLayout.u8("liquidationThreshold"),
    BufferLayout.u8("minBorrowRate"),
    BufferLayout.u8("optimalBorrowRate"),
    BufferLayout.u8("maxBorrowRate"),
    Layout.uint64("borrowFeeWad"),
    Layout.uint64("flashLoanFeeWad"),
    BufferLayout.u8("hostFeePercentage"),
    Layout.uint64("depositLimit"),
    Layout.uint64("borrowLimit"),
    Layout.publicKey("feeReceiver"),
    BufferLayout.u8("protocolLiquidationFee"),
    BufferLayout.u8("protocolTakeRate"),
    Layout.uint128("accumulatedProtocolFeesWads"),
    rateLimiter_1.RateLimiterLayout,
    Layout.uint64("addedBorrowWeightBPS"),
    Layout.uint128("liquiditySmoothedMarketPrice"),
    BufferLayout.u8("reserveType"),
    BufferLayout.u8("maxUtilizationRate"),
    Layout.uint64("superMaxBorrowRate"),
    BufferLayout.u8("maxLiquidationBonus"),
    BufferLayout.u8("maxLiquidationThreshold"),
    BufferLayout.blob(138, "padding"),
]);
function decodeReserve(buffer) {
    const reserve = exports.ReserveLayout.decode(buffer);
    return {
        version: reserve.version,
        lastUpdate: reserve.lastUpdate,
        lendingMarket: reserve.lendingMarket,
        liquidity: {
            mintPubkey: reserve.liquidityMintPubkey,
            mintDecimals: reserve.liquidityMintDecimals,
            supplyPubkey: reserve.liquiditySupplyPubkey,
            // @FIXME: oracle option
            oracleOption: reserve.liquidityOracleOption,
            pythOracle: reserve.liquidityPythOracle,
            switchboardOracle: reserve.liquiditySwitchboardOracle,
            availableAmount: reserve.liquidityAvailableAmount,
            borrowedAmountWads: reserve.liquidityBorrowedAmountWads,
            cumulativeBorrowRateWads: reserve.liquidityCumulativeBorrowRateWads,
            marketPrice: reserve.liquidityMarketPrice,
            accumulatedProtocolFeesWads: reserve.accumulatedProtocolFeesWads,
            smoothedMarketPrice: reserve.smoothedMarketPrice,
        },
        collateral: {
            mintPubkey: reserve.collateralMintPubkey,
            mintTotalSupply: reserve.collateralMintTotalSupply,
            supplyPubkey: reserve.collateralSupplyPubkey,
        },
        config: {
            optimalUtilizationRate: reserve.optimalUtilizationRate,
            maxUtilizationRate: Math.max(reserve.maxUtilizationRate, reserve.optimalUtilizationRate),
            loanToValueRatio: reserve.loanToValueRatio,
            liquidationBonus: reserve.liquidationBonus,
            maxLiquidationBonus: Math.max(reserve.maxLiquidationBonus, reserve.liquidationBonus),
            liquidationThreshold: reserve.liquidationThreshold,
            maxLiquidationThreshold: Math.max(reserve.maxLiquidationThreshold, reserve.liquidationThreshold),
            minBorrowRate: reserve.minBorrowRate,
            optimalBorrowRate: reserve.optimalBorrowRate,
            maxBorrowRate: reserve.maxBorrowRate,
            superMaxBorrowRate: reserve.superMaxBorrowRate > reserve.maxBorrowRate
                ? reserve.superMaxBorrowRate
                : new bn_js_1.default(reserve.maxBorrowRate),
            fees: {
                borrowFeeWad: reserve.borrowFeeWad,
                flashLoanFeeWad: reserve.flashLoanFeeWad,
                hostFeePercentage: reserve.hostFeePercentage,
            },
            depositLimit: reserve.depositLimit,
            borrowLimit: reserve.borrowLimit,
            feeReceiver: reserve.feeReceiver,
            // value is stored on-chain as deca bps (10 deca bp = 1 bps)
            protocolLiquidationFee: reserve.protocolLiquidationFee,
            protocolTakeRate: reserve.protocolTakeRate,
            addedBorrowWeightBPS: reserve.addedBorrowWeightBPS,
            borrowWeight: new bignumber_js_1.default(reserve.addedBorrowWeightBPS.toString())
                .dividedBy(new bignumber_js_1.default(10000))
                .plus(new bignumber_js_1.default(1))
                .toNumber(),
            reserveType: reserve.reserveType == 0 ? AssetType.Regular : AssetType.Isolated,
        },
        rateLimiter: reserve.rateLimiter,
    };
}
exports.RESERVE_SIZE = exports.ReserveLayout.span;
const isReserve = (info) => info.data.length === exports.RESERVE_SIZE;
exports.isReserve = isReserve;
const parseReserve = (pubkey, info, encoding) => {
    if (encoding === "base64+zstd") {
        info.data = buffer_1.Buffer.from(fzstd.decompress(info.data));
    }
    const { data } = info;
    const buffer = buffer_1.Buffer.from(data);
    const reserve = decodeReserve(buffer);
    if (reserve.lastUpdate.slot.isZero()) {
        return null;
    }
    const details = {
        pubkey,
        account: {
            ...info,
        },
        info: reserve,
    };
    return details;
};
exports.parseReserve = parseReserve;
function reserveToString(reserve) {
    return JSON.stringify(reserve, (key, value) => {
        // Skip padding
        if (key === "padding" || key === "oracleOption" || value === undefined) {
            return null;
        }
        switch (value.constructor.name) {
            case "PublicKey":
                return value.toBase58();
            case "BN":
                return value.toString();
            default:
                return value;
        }
    }, 2);
}
exports.reserveToString = reserveToString;
