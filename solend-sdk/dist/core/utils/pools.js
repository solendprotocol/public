"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPoolByAddress = exports.getReservesFromChain = exports.getReservesOfPool = exports.formatReserve = exports.fetchPools = void 0;
const web3_js_1 = require("@solana/web3.js");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const sbv2_lite_1 = __importDefault(require("@switchboard-xyz/sbv2-lite"));
const prices_1 = require("./prices");
const rates_1 = require("./rates");
const state_1 = require("../../state");
const utils_1 = require("./utils");
async function fetchPools(oldPools, connection, switchboardProgram, programId, currentSlot, debug) {
    const reserves = (await (0, exports.getReservesFromChain)(connection, switchboardProgram, programId, currentSlot, debug)).sort((a, b) => (a.totalSupply.isGreaterThan(b.totalSupply) ? -1 : 1));
    const pools = Object.fromEntries(oldPools.map((c) => [
        c.address,
        {
            name: c.name,
            address: c.address,
            authorityAddress: c.authorityAddress,
            reserves: [],
            owner: c.owner,
        },
    ]));
    reserves
        .filter((reserve) => oldPools.map((c) => c.address).includes(reserve.poolAddress))
        .forEach((reserve) => {
        pools[reserve.poolAddress].reserves.push(reserve);
    }, []);
    return pools;
}
exports.fetchPools = fetchPools;
function formatReserve(reserve, price, currentSlot) {
    const decimals = reserve.info.liquidity.mintDecimals;
    const availableAmount = new bignumber_js_1.default(reserve.info.liquidity.availableAmount.toString()).shiftedBy(-decimals);
    const totalBorrow = new bignumber_js_1.default(reserve.info.liquidity.borrowedAmountWads.toString()).shiftedBy(-18 - decimals);
    const accumulatedProtocolFees = new bignumber_js_1.default(reserve.info.liquidity.accumulatedProtocolFeesWads.toString()).shiftedBy(-18 - decimals);
    const totalSupply = totalBorrow
        .plus(availableAmount)
        .minus(accumulatedProtocolFees);
    const address = reserve.pubkey.toBase58();
    const priceResolved = price
        ? (0, bignumber_js_1.default)(price.spotPrice)
        : new bignumber_js_1.default(reserve.info.liquidity.marketPrice.toString()).shiftedBy(-18);
    const cTokenExchangeRate = new bignumber_js_1.default(totalSupply).dividedBy(new bignumber_js_1.default(reserve.info.collateral.mintTotalSupply.toString()).shiftedBy(-decimals));
    const cumulativeBorrowRate = new bignumber_js_1.default(reserve.info.liquidity.cumulativeBorrowRateWads.toString()).shiftedBy(-18);
    return {
        disabled: reserve.info.config.depositLimit.toString() === "0" &&
            reserve.info.config.borrowLimit.toString() === "0",
        cumulativeBorrowRate,
        cTokenExchangeRate,
        reserveUtilization: totalBorrow.dividedBy(totalSupply),
        cTokenMint: reserve.info.collateral.mintPubkey.toBase58(),
        feeReceiverAddress: reserve.info.config.feeReceiver?.toBase58(),
        reserveSupplyLimit: new bignumber_js_1.default(reserve.info.config.depositLimit.toString()).shiftedBy(-decimals),
        reserveBorrowLimit: new bignumber_js_1.default(reserve.info.config.borrowLimit.toString()).shiftedBy(-decimals),
        borrowFee: new bignumber_js_1.default(reserve.info.config.fees.borrowFeeWad.toString()).shiftedBy(-18),
        flashLoanFee: new bignumber_js_1.default(reserve.info.config.fees.flashLoanFeeWad.toString()).shiftedBy(-18),
        protocolLiquidationFee: reserve.info.config.protocolLiquidationFee / 100,
        hostFee: reserve.info.config.fees.hostFeePercentage / 100,
        interestRateSpread: reserve.info.config.protocolTakeRate / 100,
        reserveSupplyCap: new bignumber_js_1.default(reserve.info.config.depositLimit.toString()).shiftedBy(-decimals),
        reserveBorrowCap: new bignumber_js_1.default(reserve.info.config.borrowLimit.toString()).shiftedBy(-decimals),
        targetBorrowApr: reserve.info.config.optimalBorrowRate / 100,
        targetUtilization: reserve.info.config.optimalUtilizationRate / 100,
        maxUtilizationRate: reserve.info.config.maxUtilizationRate / 100,
        minBorrowApr: reserve.info.config.minBorrowRate / 100,
        maxBorrowApr: reserve.info.config.maxBorrowRate / 100,
        superMaxBorrowRate: reserve.info.config.superMaxBorrowRate.toNumber() / 100,
        supplyInterest: (0, rates_1.calculateSupplyInterest)(reserve.info, false),
        borrowInterest: (0, rates_1.calculateBorrowInterest)(reserve.info, false),
        totalSupply,
        totalBorrow,
        availableAmount,
        rateLimiter: (0, utils_1.parseRateLimiter)(reserve.info.rateLimiter, currentSlot),
        totalSupplyUsd: totalSupply.times(priceResolved),
        totalBorrowUsd: totalBorrow.times(priceResolved),
        availableAmountUsd: availableAmount.times(priceResolved),
        loanToValueRatio: reserve.info.config.loanToValueRatio / 100,
        liquidationThreshold: reserve.info.config.liquidationThreshold / 100,
        maxLiquidationThreshold: reserve.info.config.maxLiquidationThreshold / 100,
        liquidationPenalty: reserve.info.config.liquidationBonus / 100,
        maxLiquidationPenalty: reserve.info.config.maxLiquidationBonus / 100,
        liquidityAddress: reserve.info.liquidity.supplyPubkey.toBase58(),
        cTokenLiquidityAddress: reserve.info.collateral.supplyPubkey.toBase58(),
        liquidityFeeReceiverAddress: reserve.info.config.feeReceiver.toBase58(),
        address,
        mintAddress: reserve.info.liquidity.mintPubkey.toBase58(),
        decimals,
        symbol: undefined,
        price: priceResolved,
        poolAddress: reserve.info.lendingMarket.toBase58(),
        pythOracle: reserve.info.liquidity.pythOracle.toBase58(),
        switchboardOracle: reserve.info.liquidity.switchboardOracle.toBase58(),
        addedBorrowWeightBPS: reserve.info.config.addedBorrowWeightBPS,
        borrowWeight: reserve.info.config.borrowWeight,
        emaPrice: price?.emaPrice,
        minPrice: price?.emaPrice && price?.spotPrice
            ? bignumber_js_1.default.min(price.emaPrice, price.spotPrice)
            : new bignumber_js_1.default(price?.spotPrice ?? priceResolved),
        maxPrice: price?.emaPrice && price?.spotPrice
            ? bignumber_js_1.default.max(price.emaPrice, price.spotPrice)
            : new bignumber_js_1.default(price?.spotPrice ?? priceResolved),
    };
}
exports.formatReserve = formatReserve;
const getReservesOfPool = async (lendingMarketPubkey, connection, programId, currentSlot, switchboardProgram, debug) => {
    if (debug)
        console.log("getReservesOfPool");
    let sb = switchboardProgram ?? (await sbv2_lite_1.default.loadMainnet(connection));
    const filters = [
        { dataSize: 619 },
        { memcmp: { offset: 10, bytes: lendingMarketPubkey.toBase58() } },
    ];
    const rawReserves = await connection.getProgramAccounts(new web3_js_1.PublicKey(programId), {
        commitment: connection.commitment,
        filters,
        encoding: "base64",
    });
    const parsedReserves = rawReserves
        .map((reserve, index) => reserve ? (0, state_1.parseReserve)(rawReserves[index].pubkey, reserve.account) : null)
        .filter(Boolean);
    const prices = await (0, prices_1.fetchPrices)(parsedReserves, connection, sb, debug);
    return parsedReserves.map((r) => formatReserve(r, prices[r.pubkey.toBase58()], currentSlot));
};
exports.getReservesOfPool = getReservesOfPool;
const getReservesFromChain = async (connection, switchboardProgram, programId, currentSlot, debug) => {
    if (debug)
        console.log("getReservesFromChain");
    const filters = [{ dataSize: 619 }];
    const rawReserves = await connection.getProgramAccounts(new web3_js_1.PublicKey(programId), {
        commitment: connection.commitment,
        filters,
        encoding: "base64",
    });
    const parsedReserves = rawReserves
        .map((reserve, index) => reserve ? (0, state_1.parseReserve)(rawReserves[index].pubkey, reserve.account) : null)
        .filter(Boolean);
    const prices = await (0, prices_1.fetchPrices)(parsedReserves, connection, switchboardProgram, debug);
    return parsedReserves.map((r) => formatReserve(r, prices[r.pubkey.toBase58()], currentSlot));
};
exports.getReservesFromChain = getReservesFromChain;
async function fetchPoolByAddress(poolAddress, connection, debug) {
    if (debug)
        console.log("fetchPoolByAddress");
    const accountInfo = await connection.getAccountInfo(new web3_js_1.PublicKey(poolAddress));
    if (!accountInfo) {
        return null;
    }
    return (0, state_1.parseReserve)(new web3_js_1.PublicKey(poolAddress), accountInfo);
}
exports.fetchPoolByAddress = fetchPoolByAddress;
