"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateBorrowInterest = exports.calculateSupplyInterest = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const constants_1 = require("../constants");
const calculateSupplyAPR = (reserve) => {
    const currentUtilization = calculateUtilizationRatio(reserve);
    const borrowAPR = calculateBorrowAPR(reserve);
    const protocolTakePercentage = (0, bignumber_js_1.default)(1).minus(reserve.config.protocolTakeRate / 100);
    return currentUtilization.times(borrowAPR).times(protocolTakePercentage);
};
const calculateUtilizationRatio = (reserve) => {
    const borrowedAmount = new bignumber_js_1.default(reserve.liquidity.borrowedAmountWads.toString()).shiftedBy(-18);
    const totalSupply = borrowedAmount.plus(reserve.liquidity.availableAmount.toString());
    const currentUtilization = borrowedAmount.dividedBy(totalSupply);
    return currentUtilization;
};
const calculateBorrowAPR = (reserve) => {
    const currentUtilization = calculateUtilizationRatio(reserve);
    const optimalUtilization = new bignumber_js_1.default(reserve.config.optimalUtilizationRate / 100);
    const maxUtilizationRate = new bignumber_js_1.default(reserve.config.maxUtilizationRate / 100);
    let borrowAPR;
    if (currentUtilization.isLessThanOrEqualTo(optimalUtilization)) {
        const minBorrowRate = new bignumber_js_1.default(reserve.config.minBorrowRate / 100);
        if (optimalUtilization.isEqualTo(0)) {
            return minBorrowRate;
        }
        const normalizedFactor = currentUtilization.dividedBy(optimalUtilization);
        const optimalBorrowRate = new bignumber_js_1.default(reserve.config.optimalBorrowRate / 100);
        borrowAPR = normalizedFactor
            .times(optimalBorrowRate.minus(minBorrowRate))
            .plus(minBorrowRate);
    }
    else if (currentUtilization.isLessThanOrEqualTo(maxUtilizationRate)) {
        const weight = currentUtilization
            .minus(optimalUtilization)
            .dividedBy(maxUtilizationRate.minus(optimalUtilization));
        const optimalBorrowRate = new bignumber_js_1.default(reserve.config.optimalBorrowRate / 100);
        const maxBorrowRate = new bignumber_js_1.default(reserve.config.maxBorrowRate / 100);
        borrowAPR = weight
            .times(maxBorrowRate.minus(optimalBorrowRate))
            .plus(optimalBorrowRate);
    }
    else {
        const weight = currentUtilization
            .minus(maxUtilizationRate)
            .dividedBy(new bignumber_js_1.default(1).minus(maxUtilizationRate));
        const maxBorrowRate = new bignumber_js_1.default(reserve.config.maxBorrowRate / 100);
        const superMaxBorrowRate = new bignumber_js_1.default(reserve.config.superMaxBorrowRate.toNumber() / 100);
        borrowAPR = weight
            .times(superMaxBorrowRate.minus(maxBorrowRate))
            .plus(maxBorrowRate);
    }
    return borrowAPR;
};
const calculateSupplyAPY = (reserve) => {
    const apr = calculateSupplyAPR(reserve);
    const apy = new bignumber_js_1.default(1)
        .plus(new bignumber_js_1.default(apr).dividedBy(constants_1.SLOTS_PER_YEAR))
        .toNumber() **
        constants_1.SLOTS_PER_YEAR -
        1;
    return new bignumber_js_1.default(apy);
};
const calculateBorrowAPY = (reserve) => {
    const apr = calculateBorrowAPR(reserve);
    const apy = new bignumber_js_1.default(1)
        .plus(new bignumber_js_1.default(apr).dividedBy(constants_1.SLOTS_PER_YEAR))
        .toNumber() **
        constants_1.SLOTS_PER_YEAR -
        1;
    return new bignumber_js_1.default(apy);
};
const calculateSupplyInterest = (reserve, showApy) => showApy ? calculateSupplyAPY(reserve) : calculateSupplyAPR(reserve);
exports.calculateSupplyInterest = calculateSupplyInterest;
const calculateBorrowInterest = (reserve, showApy) => showApy ? calculateBorrowAPY(reserve) : calculateBorrowAPR(reserve);
exports.calculateBorrowInterest = calculateBorrowInterest;
