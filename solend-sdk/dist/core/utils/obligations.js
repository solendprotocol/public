"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getObligationAddressWithSeed = exports.getNthObligationSeed = exports.fetchObligationsOfPoolByWallet = exports.fetchObligationsByWallet = exports.fetchObligationsByAddress = exports.fetchObligationByAddress = exports.formatObligation = void 0;
const web3_js_1 = require("@solana/web3.js");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const state_1 = require("../../state");
const js_sha256_1 = require("js-sha256");
const utils_1 = require("./utils");
const constants_1 = require("../constants");
function formatObligation(obligation, pool) {
    const poolAddress = obligation.info.lendingMarket.toBase58();
    let minPriceUserTotalSupply = new bignumber_js_1.default(0);
    let minPriceBorrowLimit = new bignumber_js_1.default(0);
    let maxPriceUserTotalWeightedBorrow = new bignumber_js_1.default(0);
    const deposits = obligation.info.deposits.map((d) => {
        const reserveAddress = d.depositReserve.toBase58();
        const reserve = pool.reserves.find((r) => r.address === reserveAddress);
        if (!reserve)
            throw Error("Deposit in obligation does not exist in the pool");
        const amount = new bignumber_js_1.default(d.depositedAmount.toString())
            .shiftedBy(-reserve.decimals)
            .times(reserve.cTokenExchangeRate);
        const amountUsd = amount.times(reserve.price);
        minPriceUserTotalSupply = minPriceUserTotalSupply.plus(amount.times(reserve.minPrice));
        minPriceBorrowLimit = minPriceBorrowLimit.plus(amount.times(reserve.minPrice).times(reserve.loanToValueRatio));
        return {
            liquidationThreshold: reserve.liquidationThreshold,
            loanToValueRatio: reserve.loanToValueRatio,
            symbol: reserve.symbol,
            price: reserve.price,
            mintAddress: reserve.mintAddress,
            reserveAddress,
            amount,
            amountUsd,
            annualInterest: amountUsd.multipliedBy(reserve.supplyInterest),
        };
    });
    const borrows = obligation.info.borrows.map((b) => {
        const reserveAddress = b.borrowReserve.toBase58();
        const reserve = pool.reserves.find((r) => r.address === reserveAddress);
        if (!reserve)
            throw Error("Borrow in obligation does not exist in the pool");
        const amount = new bignumber_js_1.default(b.borrowedAmountWads.toString())
            .shiftedBy(-18 - reserve.decimals)
            .times(reserve.cumulativeBorrowRate)
            .dividedBy(new bignumber_js_1.default(b.cumulativeBorrowRateWads.toString()).shiftedBy(-18));
        const amountUsd = amount.times(reserve.price);
        const maxPrice = reserve.emaPrice
            ? bignumber_js_1.default.max(reserve.emaPrice, reserve.price)
            : reserve.price;
        maxPriceUserTotalWeightedBorrow = maxPriceUserTotalWeightedBorrow.plus(amount
            .times(maxPrice)
            .times(reserve.borrowWeight ? reserve.borrowWeight : constants_1.U64_MAX));
        return {
            liquidationThreshold: reserve.liquidationThreshold,
            loanToValueRatio: reserve.loanToValueRatio,
            symbol: reserve.symbol,
            price: reserve.price,
            reserveAddress,
            mintAddress: reserve.mintAddress,
            borrowWeight: reserve.borrowWeight,
            amount,
            amountUsd,
            weightedAmountUsd: new bignumber_js_1.default(reserve.borrowWeight).multipliedBy(amountUsd),
            annualInterest: amountUsd.multipliedBy(reserve.borrowInterest),
        };
    });
    const totalSupplyValue = deposits.reduce((acc, d) => acc.plus(d.amountUsd), new bignumber_js_1.default(0));
    const totalBorrowValue = borrows.reduce((acc, b) => acc.plus(b.amountUsd), new bignumber_js_1.default(0));
    const weightedTotalBorrowValue = borrows.reduce((acc, b) => acc.plus(b.weightedAmountUsd), new bignumber_js_1.default(0));
    const borrowLimit = deposits.reduce((acc, d) => d.amountUsd.times(d.loanToValueRatio).plus(acc), (0, bignumber_js_1.default)(0));
    const liquidationThreshold = deposits.reduce((acc, d) => d.amountUsd.times(d.liquidationThreshold).plus(acc), (0, bignumber_js_1.default)(0));
    const netAccountValue = totalSupplyValue.minus(totalBorrowValue);
    const liquidationThresholdFactor = totalSupplyValue.isZero()
        ? new bignumber_js_1.default(0)
        : liquidationThreshold.dividedBy(totalSupplyValue);
    const borrowLimitFactor = totalSupplyValue.isZero()
        ? new bignumber_js_1.default(0)
        : borrowLimit.dividedBy(totalSupplyValue);
    const borrowUtilization = borrowLimit.isZero()
        ? new bignumber_js_1.default(0)
        : totalBorrowValue.dividedBy(borrowLimit);
    const weightedBorrowUtilization = minPriceBorrowLimit.isZero()
        ? new bignumber_js_1.default(0)
        : weightedTotalBorrowValue.dividedBy(borrowLimit);
    const isBorrowLimitReached = borrowUtilization.isGreaterThanOrEqualTo(new bignumber_js_1.default("1"));
    const borrowOverSupply = totalSupplyValue.isZero()
        ? new bignumber_js_1.default(0)
        : totalBorrowValue.dividedBy(totalSupplyValue);
    const positions = obligation.info.deposits.filter((d) => !d.depositedAmount.isZero()).length +
        obligation.info.borrows.filter((b) => !b.borrowedAmountWads.isZero())
            .length;
    const weightedConservativeBorrowUtilization = minPriceBorrowLimit.isZero()
        ? new bignumber_js_1.default(0)
        : maxPriceUserTotalWeightedBorrow.dividedBy(minPriceBorrowLimit);
    const annualSupplyInterest = deposits.reduce((acc, d) => d.annualInterest.plus(acc), new bignumber_js_1.default(0));
    const annualBorrowInterest = borrows.reduce((acc, b) => b.annualInterest.plus(acc), new bignumber_js_1.default(0));
    const netApy = annualSupplyInterest
        .minus(annualBorrowInterest)
        .div(netAccountValue.toString());
    return {
        address: obligation.pubkey.toBase58(),
        positions,
        deposits,
        borrows,
        poolAddress,
        totalSupplyValue,
        totalBorrowValue,
        borrowLimit,
        liquidationThreshold,
        netAccountValue,
        liquidationThresholdFactor,
        borrowLimitFactor,
        borrowUtilization,
        weightedConservativeBorrowUtilization,
        weightedBorrowUtilization,
        isBorrowLimitReached,
        borrowOverSupply,
        weightedTotalBorrowValue,
        minPriceUserTotalSupply,
        minPriceBorrowLimit,
        maxPriceUserTotalWeightedBorrow,
        netApy,
    };
}
exports.formatObligation = formatObligation;
async function fetchObligationByAddress(obligationAddress, connection, debug) {
    if (debug)
        console.log("fetchObligationByAddress");
    const rawObligationData = await connection.getAccountInfo(new web3_js_1.PublicKey(obligationAddress));
    if (!rawObligationData) {
        return null;
    }
    const parsedObligation = (0, state_1.parseObligation)(new web3_js_1.PublicKey(obligationAddress), rawObligationData);
    if (!parsedObligation) {
        return null;
    }
    return parsedObligation;
}
exports.fetchObligationByAddress = fetchObligationByAddress;
async function fetchObligationsByAddress(obligationAddresses, connection, debug) {
    if (debug)
        console.log("fetchObligationsByAddress", obligationAddresses.length);
    const rawObligations = await (0, utils_1.getBatchMultipleAccountsInfo)(obligationAddresses, connection);
    const parsedObligations = rawObligations
        .map((obligation, index) => obligation
        ? (0, state_1.parseObligation)(new web3_js_1.PublicKey(obligationAddresses[index]), obligation)
        : null)
        .filter(Boolean);
    return parsedObligations;
}
exports.fetchObligationsByAddress = fetchObligationsByAddress;
async function fetchObligationsByWallet(publicKey, connection, programId, debug) {
    if (debug)
        console.log("fetchObligationsByWallet");
    const filters = [
        { dataSize: state_1.OBLIGATION_SIZE },
        { memcmp: { offset: 42, bytes: publicKey.toBase58() } },
    ];
    const rawObligations = await connection.getProgramAccounts(new web3_js_1.PublicKey(programId), {
        commitment: connection.commitment,
        filters,
        encoding: "base64",
    });
    const parsedObligations = rawObligations
        .map((obligation, index) => obligation ? (0, state_1.parseObligation)(obligation.pubkey, obligation.account) : null)
        .filter(Boolean);
    return parsedObligations;
}
exports.fetchObligationsByWallet = fetchObligationsByWallet;
async function fetchObligationsOfPoolByWallet(publicKey, poolAddress, programId, connection, debug) {
    if (debug)
        console.log("fetchObligationsByWallet");
    const filters = [
        { dataSize: state_1.OBLIGATION_SIZE },
        { memcmp: { offset: 42, bytes: publicKey.toBase58() } },
        { memcmp: { offset: 10, bytes: poolAddress.toBase58() } },
    ];
    const rawObligations = await connection.getProgramAccounts(programId, {
        commitment: connection.commitment,
        filters,
        encoding: "base64",
    });
    const parsedObligations = rawObligations
        .map((obligation, index) => obligation ? (0, state_1.parseObligation)(obligation.pubkey, obligation.account) : null)
        .filter(Boolean);
    return parsedObligations;
}
exports.fetchObligationsOfPoolByWallet = fetchObligationsOfPoolByWallet;
function createWithSeedSync(fromPublicKey, seed, programId) {
    const buffer = Buffer.concat([
        fromPublicKey.toBuffer(),
        Buffer.from(seed),
        programId.toBuffer(),
    ]);
    const hash = js_sha256_1.sha256.digest(buffer);
    return new web3_js_1.PublicKey(Buffer.from(hash));
}
function getNthObligationSeed(lendingMarket, n) {
    return lendingMarket.toBase58().slice(0, 24) + `0000000${n}m`.slice(-7);
}
exports.getNthObligationSeed = getNthObligationSeed;
function getObligationAddressWithSeed(publicKey, seed, programId) {
    // <first 25 char of lending market address> + <7 chars: 0000001 - 9999999>
    return createWithSeedSync(publicKey, seed, programId);
}
exports.getObligationAddressWithSeed = getObligationAddressWithSeed;
