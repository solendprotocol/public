"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyObligation = exports.BigZero = exports.getProgramId = exports.SOLEND_BETA_PROGRAM_ID = exports.SOLEND_DEVNET_PROGRAM_ID = exports.SOLEND_PRODUCTION_PROGRAM_ID = exports.NULL_ORACLE = exports.U64_MAX = exports.SOLEND_ADDRESSES = exports.SLOTS_PER_YEAR = exports.SOL_PADDING_FOR_INTEREST = exports.POSITION_LIMIT = exports.WAD = void 0;
const web3_js_1 = require("@solana/web3.js");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
exports.WAD = "1".concat(Array(18 + 1).join("0"));
exports.POSITION_LIMIT = 6;
exports.SOL_PADDING_FOR_INTEREST = "1000000";
exports.SLOTS_PER_YEAR = 63072000;
exports.SOLEND_ADDRESSES = [
    "5pHk2TmnqQzRF9L6egy5FfiyBgS7G9cMZ5RFaJAvghzw",
    "yaDPAockQPna7Srx5LB2TugJSKHUduHghyZdQcn7zYz",
    "81KTtWjRndxGQbJHGJq6EaJWL8JfXbyywVvZReVPQd1X",
    "GDmSxpPzLkfxxr6dHLNRnCoYVGzvgc41tozkrr4pHTjB",
];
exports.U64_MAX = "18446744073709551615";
exports.NULL_ORACLE = new web3_js_1.PublicKey("nu11111111111111111111111111111111111111111");
exports.SOLEND_PRODUCTION_PROGRAM_ID = new web3_js_1.PublicKey("So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo");
exports.SOLEND_DEVNET_PROGRAM_ID = new web3_js_1.PublicKey("ALend7Ketfx5bxh6ghsCDXAoDrhvEmsXT3cynB6aPLgx");
exports.SOLEND_BETA_PROGRAM_ID = new web3_js_1.PublicKey("BLendhFh4HGnycEDDFhbeFEUYLP4fXB5tTHMoTX8Dch5");
function getProgramId(environment) {
    switch (environment) {
        case "mainnet-beta":
        case "production":
            return exports.SOLEND_PRODUCTION_PROGRAM_ID;
            break;
        case "devnet":
            return exports.SOLEND_DEVNET_PROGRAM_ID;
            break;
        case "beta":
            return exports.SOLEND_BETA_PROGRAM_ID;
            break;
    }
    throw Error(`Unsupported environment: ${environment}`);
}
exports.getProgramId = getProgramId;
exports.BigZero = new bignumber_js_1.default(0);
exports.EmptyObligation = {
    address: "empty",
    positions: 0,
    deposits: [],
    borrows: [],
    poolAddress: "",
    totalSupplyValue: exports.BigZero,
    totalBorrowValue: exports.BigZero,
    borrowLimit: exports.BigZero,
    liquidationThreshold: exports.BigZero,
    netAccountValue: exports.BigZero,
    liquidationThresholdFactor: exports.BigZero,
    borrowLimitFactor: exports.BigZero,
    borrowUtilization: exports.BigZero,
    weightedConservativeBorrowUtilization: exports.BigZero,
    weightedBorrowUtilization: exports.BigZero,
    isBorrowLimitReached: false,
    borrowOverSupply: exports.BigZero,
    weightedTotalBorrowValue: exports.BigZero,
    minPriceUserTotalSupply: exports.BigZero,
    minPriceBorrowLimit: exports.BigZero,
    maxPriceUserTotalWeightedBorrow: exports.BigZero,
    netApy: exports.BigZero,
};
