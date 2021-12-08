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
exports.parseLendingMarket = exports.isLendingMarket = exports.LENDING_MARKET_SIZE = exports.LendingMarketLayout = void 0;
const BufferLayout = __importStar(require("buffer-layout"));
const Layout = __importStar(require("../utils/layout"));
exports.LendingMarketLayout = BufferLayout.struct([
    BufferLayout.u8('version'),
    BufferLayout.u8('bumpSeed'),
    Layout.publicKey('owner'),
    Layout.publicKey('quoteTokenMint'),
    Layout.publicKey('tokenProgramId'),
    Layout.publicKey('oracleProgramId'),
    Layout.publicKey('switchboardOracleProgramId'),
    BufferLayout.blob(128, 'padding'),
]);
exports.LENDING_MARKET_SIZE = exports.LendingMarketLayout.span;
const isLendingMarket = (info) => info.data.length === exports.LendingMarketLayout.span;
exports.isLendingMarket = isLendingMarket;
const parseLendingMarket = (pubkey, info) => {
    const buffer = Buffer.from(info.data);
    const lendingMarket = exports.LendingMarketLayout.decode(buffer);
    const details = {
        pubkey,
        account: Object.assign({}, info),
        info: lendingMarket,
    };
    return details;
};
exports.parseLendingMarket = parseLendingMarket;
