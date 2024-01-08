"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatErrorMsg = exports.createObligationAddress = exports.getBatchMultipleAccountsInfo = exports.titleCase = exports.formatAddress = exports.remainingOutflow = exports.parseRateLimiter = exports.OUTFLOW_BUFFER = void 0;
const web3_js_1 = require("@solana/web3.js");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const ADDRESS_PREFIX_SUFFIX_LENGTH = 6;
exports.OUTFLOW_BUFFER = 0.985;
const parseRateLimiter = (rateLimiter, currentSlot) => {
    const convertedRateLimiter = {
        config: {
            windowDuration: new bignumber_js_1.default(rateLimiter.config.windowDuration.toString()),
            maxOutflow: new bignumber_js_1.default(rateLimiter.config.maxOutflow.toString()),
        },
        windowStart: new bignumber_js_1.default(rateLimiter.windowStart.toString()),
        previousQuantity: new bignumber_js_1.default(rateLimiter.previousQuantity.toString()).shiftedBy(-18),
        currentQuantity: new bignumber_js_1.default(rateLimiter.currentQuantity.toString()).shiftedBy(-18),
    };
    return {
        ...convertedRateLimiter,
        remainingOutflow: (0, exports.remainingOutflow)(currentSlot, convertedRateLimiter),
    };
};
exports.parseRateLimiter = parseRateLimiter;
const remainingOutflow = (currentSlot, rateLimiter) => {
    if (rateLimiter.config.windowDuration.eq(new bignumber_js_1.default(0))) {
        return null;
    }
    const curSlot = new bignumber_js_1.default(currentSlot);
    const windowDuration = rateLimiter.config.windowDuration;
    const previousQuantity = rateLimiter.previousQuantity;
    const currentQuantity = rateLimiter.currentQuantity;
    const maxOutflow = rateLimiter.config.maxOutflow;
    const windowStart = rateLimiter.windowStart;
    const curSlotStart = curSlot
        .dividedBy(windowDuration)
        .integerValue(bignumber_js_1.default.ROUND_FLOOR)
        .times(windowDuration);
    const prevWeight = windowDuration
        .minus(curSlot.minus(curSlotStart).plus(new bignumber_js_1.default(1)))
        .dividedBy(windowDuration);
    let outflow = new bignumber_js_1.default(0);
    if (windowStart.isEqualTo(curSlotStart)) {
        const curOutflow = prevWeight.times(previousQuantity.plus(currentQuantity));
        outflow = maxOutflow.minus(curOutflow);
    }
    else if (windowStart.plus(windowDuration).isEqualTo(curSlotStart)) {
        const curOutflow = prevWeight.times(currentQuantity);
        outflow = maxOutflow.minus(curOutflow);
    }
    else {
        outflow = maxOutflow;
    }
    return outflow.times(new bignumber_js_1.default(exports.OUTFLOW_BUFFER));
};
exports.remainingOutflow = remainingOutflow;
const formatAddress = (address, length) => {
    return `${address.slice(0, length ?? ADDRESS_PREFIX_SUFFIX_LENGTH)}...${address.slice(-(length ?? ADDRESS_PREFIX_SUFFIX_LENGTH))}`;
};
exports.formatAddress = formatAddress;
const titleCase = (name) => {
    return name.charAt(0).toUpperCase().concat(name.slice(1));
};
exports.titleCase = titleCase;
async function getBatchMultipleAccountsInfo(addresses, connection) {
    const keys = addresses.map((add) => new web3_js_1.PublicKey(add));
    const res = keys.reduce((acc, _curr, i) => {
        if (!(i % 100)) {
            // if index is 0 or can be divided by the `size`...
            acc.push(keys.slice(i, i + 100)); // ..push a chunk of the original array to the accumulator
        }
        return acc;
    }, []);
    return (await Promise.all(res.map((accountGroup) => connection.getMultipleAccountsInfo(accountGroup, "processed")))).flatMap((x) => x);
}
exports.getBatchMultipleAccountsInfo = getBatchMultipleAccountsInfo;
async function createObligationAddress(publicKey, marketAddress, programId) {
    return (await web3_js_1.PublicKey.createWithSeed(new web3_js_1.PublicKey(publicKey), marketAddress.slice(0, 32), new web3_js_1.PublicKey(programId))).toBase58();
}
exports.createObligationAddress = createObligationAddress;
const errorList = [
    "Failed to unpack instruction data",
    "Account is already initialized",
    "Lamport balance below rent-exempt threshold",
    "Market authority is invalid",
    "Market owner is invalid",
    "Input account owner is not the program plusress",
    "Input token account is not owned by the correct token program id",
    "Input token account is not valid",
    "Input token mint account is not valid",
    "Input token program account is not valid",
    "Input amount is invalid",
    "Input config value is invalid",
    "Input account must be a signer",
    "Invalid account input",
    "Math operation overflow",
    "Token initialize mint failed",
    "Token initialize account failed",
    "Token transfer failed",
    "Token mint to failed",
    "Token burn failed",
    "Insufficient liquidity available",
    "Input reserve has collateral disabled",
    "Reserve state needs to be refreshed",
    "Withdraw amount too small",
    "Withdraw amount too large",
    "Borrow amount too small to receive liquidity after fees",
    "Borrow amount too large for deposited collateral",
    "Repay amount too small to transfer liquidity",
    "Liquidation amount too small to receive collateral",
    "Cannot liquidate healthy obligations",
    "Obligation state needs to be refreshed",
    "Obligation reserve limit exceeded",
    "Obligation owner is invalid",
    "Obligation deposits are empty",
    "Obligation borrows are empty",
    "Obligation deposits have zero value",
    "Obligation borrows have zero value",
    "Invalid obligation collateral",
    "Invalid obligation liquidity",
    "Obligation collateral is empty",
    "Obligation liquidity is empty",
    "Interest rate is negative",
    "Input oracle config is invalid",
    "Input flash loan receiver program account is not valid",
    "Not enough liquidity after flash loan",
    "Null oracle config",
];
function formatErrorMsg(errorMessage) {
    const error = errorMessage.split(": 0x")[1];
    if (!error) {
        return errorMessage;
    }
    return `${errorMessage}\n${errorList[parseInt(error, 16)]}`;
}
exports.formatErrorMsg = formatErrorMsg;
