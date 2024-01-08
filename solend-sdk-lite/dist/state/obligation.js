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
exports.parseObligation = exports.isObligation = exports.OBLIGATION_SIZE = exports.ObligationLiquidityLayout = exports.ObligationCollateralLayout = exports.ObligationLayout = exports.obligationToString = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const fzstd = __importStar(require("fzstd"));
const Layout = __importStar(require("../layout"));
const lastUpdate_1 = require("./lastUpdate");
const BufferLayout = require("buffer-layout");
// BN defines toJSON property, which messes up serialization
// @ts-ignore
bn_js_1.default.prototype.toJSON = undefined;
function obligationToString(obligation) {
    return JSON.stringify(obligation, (key, value) => {
        // Skip padding
        if (key === "padding") {
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
exports.obligationToString = obligationToString;
exports.ObligationLayout = BufferLayout.struct([
    BufferLayout.u8("version"),
    lastUpdate_1.LastUpdateLayout,
    Layout.publicKey("lendingMarket"),
    Layout.publicKey("owner"),
    Layout.uint128("depositedValue"),
    Layout.uint128("borrowedValue"),
    Layout.uint128("allowedBorrowValue"),
    Layout.uint128("unhealthyBorrowValue"),
    Layout.uint128("borrowedValueUpperBound"),
    BufferLayout.u8("borrowingIsolatedAsset"),
    Layout.uint128("superUnhealthyBorrowValue"),
    BufferLayout.blob(31, "_padding"),
    BufferLayout.u8("depositsLen"),
    BufferLayout.u8("borrowsLen"),
    BufferLayout.blob(1096, "dataFlat"),
]);
exports.ObligationCollateralLayout = BufferLayout.struct([
    Layout.publicKey("depositReserve"),
    Layout.uint64("depositedAmount"),
    Layout.uint128("marketValue"),
    BufferLayout.blob(32, "padding"),
]);
exports.ObligationLiquidityLayout = BufferLayout.struct([
    Layout.publicKey("borrowReserve"),
    Layout.uint128("cumulativeBorrowRateWads"),
    Layout.uint128("borrowedAmountWads"),
    Layout.uint128("marketValue"),
    BufferLayout.blob(32, "padding"),
]);
exports.OBLIGATION_SIZE = exports.ObligationLayout.span;
const isObligation = (info) => info.data.length === exports.ObligationLayout.span;
exports.isObligation = isObligation;
const parseObligation = (pubkey, info, encoding) => {
    if (encoding === "base64+zstd") {
        info.data = Buffer.from(fzstd.decompress(info.data));
    }
    const { data } = info;
    const buffer = Buffer.from(data);
    const { version, lastUpdate, lendingMarket, owner, depositedValue, borrowedValue, allowedBorrowValue, unhealthyBorrowValue, borrowedValueUpperBound, depositsLen, borrowsLen, dataFlat, } = exports.ObligationLayout.decode(buffer);
    if (lastUpdate.slot.isZero()) {
        return null;
    }
    const depositsBuffer = dataFlat.slice(0, depositsLen * exports.ObligationCollateralLayout.span);
    const deposits = BufferLayout.seq(exports.ObligationCollateralLayout, depositsLen).decode(depositsBuffer);
    const borrowsBuffer = dataFlat.slice(depositsBuffer.length, depositsLen * exports.ObligationCollateralLayout.span +
        borrowsLen * exports.ObligationLiquidityLayout.span);
    const borrows = BufferLayout.seq(exports.ObligationLiquidityLayout, borrowsLen).decode(borrowsBuffer);
    const obligation = {
        version,
        lastUpdate,
        lendingMarket,
        owner,
        depositedValue,
        borrowedValue,
        allowedBorrowValue,
        unhealthyBorrowValue,
        borrowedValueUpperBound,
        deposits,
        borrows,
    };
    const details = {
        pubkey,
        account: {
            ...info,
        },
        info: obligation,
    };
    return details;
};
exports.parseObligation = parseObligation;
