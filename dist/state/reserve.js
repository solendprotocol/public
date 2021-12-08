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
Object.defineProperty(exports, "__esModule", { value: true });
exports.reserveToString = exports.ReserveParser = exports.isReserve = exports.RESERVE_SIZE = exports.ReserveLayout = void 0;
const BufferLayout = __importStar(require("buffer-layout"));
const Layout = __importStar(require("../utils/layout"));
const lastUpdate_1 = require("./lastUpdate");
exports.ReserveLayout = BufferLayout.struct([
    BufferLayout.u8('version'),
    lastUpdate_1.LastUpdateLayout,
    Layout.publicKey('lendingMarket'),
    BufferLayout.struct([
        Layout.publicKey('mintPubkey'),
        BufferLayout.u8('mintDecimals'),
        Layout.publicKey('supplyPubkey'),
        // @FIXME: oracle option
        // TODO: replace u32 option with generic equivalent
        // BufferLayout.u32('oracleOption'),
        Layout.publicKey('pythOracle'),
        Layout.publicKey('switchboardOracle'),
        Layout.uint64('availableAmount'),
        Layout.uint128('borrowedAmountWads'),
        Layout.uint128('cumulativeBorrowRateWads'),
        Layout.uint128('marketPrice'),
    ], 'liquidity'),
    BufferLayout.struct([
        Layout.publicKey('mintPubkey'),
        Layout.uint64('mintTotalSupply'),
        Layout.publicKey('supplyPubkey'),
    ], 'collateral'),
    BufferLayout.struct([
        BufferLayout.u8('optimalUtilizationRate'),
        BufferLayout.u8('loanToValueRatio'),
        BufferLayout.u8('liquidationBonus'),
        BufferLayout.u8('liquidationThreshold'),
        BufferLayout.u8('minBorrowRate'),
        BufferLayout.u8('optimalBorrowRate'),
        BufferLayout.u8('maxBorrowRate'),
        BufferLayout.struct([
            Layout.uint64('borrowFeeWad'),
            Layout.uint64('flashLoanFeeWad'),
            BufferLayout.u8('hostFeePercentage'),
        ], 'fees'),
        Layout.uint64('depositLimit'),
        Layout.uint64('borrowLimit'),
        Layout.publicKey('feeReceiver'),
    ], 'config'),
    BufferLayout.blob(256, 'padding'),
]);
exports.RESERVE_SIZE = exports.ReserveLayout.span;
const isReserve = (info) => info.data.length === exports.ReserveLayout.span;
exports.isReserve = isReserve;
const ReserveParser = (pubkey, info) => {
    const { data } = info;
    const buffer = Buffer.from(data);
    const reserve = exports.ReserveLayout.decode(buffer);
    if (reserve.lastUpdate.slot.isZero()) {
        return null;
    }
    const details = {
        pubkey,
        account: Object.assign({}, info),
        info: reserve,
    };
    return details;
};
exports.ReserveParser = ReserveParser;
function reserveToString(reserve) {
    return JSON.stringify(reserve, (key, value) => {
        // Skip padding
        if (key === 'padding') {
            return null;
        }
        switch (value.constructor.name) {
            case 'PublicKey':
                return value.toBase58();
            case 'BN':
                return value.toString();
            default:
                return value;
        }
    }, 2);
}
exports.reserveToString = reserveToString;
