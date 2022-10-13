"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateRefreshedObligation = exports.RISKY_OBLIGATION_THRESHOLD = void 0;
/* eslint-disable @typescript-eslint/no-throw-literal */
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var underscore_1 = require("underscore");
var reserve_1 = require("models/layouts/reserve");
exports.RISKY_OBLIGATION_THRESHOLD = 78;
// This function doesn't actually refresh the obligation within the blockchain
// but does offchain calculation which mimics the actual refreshObligation instruction
// to optimize of transaction fees.
function calculateRefreshedObligation(obligation, reserves, tokensOracle) {
    var depositedValue = new bignumber_js_1.default(0);
    var borrowedValue = new bignumber_js_1.default(0);
    var allowedBorrowValue = new bignumber_js_1.default(0);
    var unhealthyBorrowValue = new bignumber_js_1.default(0);
    var deposits = [];
    var borrows = [];
    obligation.deposits.forEach(function (deposit) {
        var tokenOracle = (0, underscore_1.findWhere)(tokensOracle, { reserveAddress: deposit.depositReserve.toString() });
        if (!tokenOracle) {
            throw "Missing token info for reserve ".concat(deposit.depositReserve.toString(), ", skipping this obligation. Please restart liquidator to fetch latest configs from /v1/config");
        }
        var price = tokenOracle.price, decimals = tokenOracle.decimals, symbol = tokenOracle.symbol;
        var reserve = (0, underscore_1.find)(reserves, function (r) { return r.pubkey.toString() === deposit.depositReserve.toString(); }).info;
        var collateralExchangeRate = (0, reserve_1.getCollateralExchangeRate)(reserve);
        var marketValue = new bignumber_js_1.default(deposit.depositedAmount.toString())
            .multipliedBy(reserve_1.WAD)
            .dividedBy(collateralExchangeRate)
            .multipliedBy(price)
            .dividedBy(decimals);
        var loanToValueRate = (0, reserve_1.getLoanToValueRate)(reserve);
        var liquidationThresholdRate = (0, reserve_1.getLiquidationThresholdRate)(reserve);
        depositedValue = depositedValue.plus(marketValue);
        allowedBorrowValue = allowedBorrowValue.plus(marketValue.multipliedBy(loanToValueRate));
        unhealthyBorrowValue = unhealthyBorrowValue.plus(marketValue.multipliedBy(liquidationThresholdRate));
        deposits.push({
            depositReserve: deposit.depositReserve,
            depositAmount: deposit.depositedAmount,
            marketValue: marketValue,
            symbol: symbol,
        });
    });
    obligation.borrows.forEach(function (borrow) {
        var borrowAmountWads = new bignumber_js_1.default(borrow.borrowedAmountWads.toString());
        var tokenOracle = (0, underscore_1.findWhere)(tokensOracle, { reserveAddress: borrow.borrowReserve.toString() });
        if (!tokenOracle) {
            throw "Missing token info for reserve ".concat(borrow.borrowReserve.toString(), ", skipping this obligation. Please restart liquidator to fetch latest config from /v1/config.");
        }
        var price = tokenOracle.price, decimals = tokenOracle.decimals, symbol = tokenOracle.symbol, mintAddress = tokenOracle.mintAddress;
        var reserve = (0, underscore_1.find)(reserves, function (r) { return r.pubkey.toString() === borrow.borrowReserve.toString(); }).info;
        var borrowAmountWadsWithInterest = getBorrrowedAmountWadsWithInterest(new bignumber_js_1.default(reserve.liquidity.cumulativeBorrowRateWads.toString()), new bignumber_js_1.default(borrow.cumulativeBorrowRateWads.toString()), borrowAmountWads);
        var marketValue = borrowAmountWadsWithInterest
            .multipliedBy(price)
            .dividedBy(decimals);
        borrowedValue = borrowedValue.plus(marketValue);
        borrows.push({
            borrowReserve: borrow.borrowReserve,
            borrowAmountWads: borrow.borrowedAmountWads,
            mintAddress: mintAddress,
            marketValue: marketValue,
            symbol: symbol,
        });
    });
    var utilizationRatio = borrowedValue.dividedBy(depositedValue).multipliedBy(100).toNumber();
    utilizationRatio = Number.isNaN(utilizationRatio) ? 0 : utilizationRatio;
    return {
        depositedValue: depositedValue,
        borrowedValue: borrowedValue,
        allowedBorrowValue: allowedBorrowValue,
        unhealthyBorrowValue: unhealthyBorrowValue,
        deposits: deposits,
        borrows: borrows,
        utilizationRatio: utilizationRatio,
    };
}
exports.calculateRefreshedObligation = calculateRefreshedObligation;
function getBorrrowedAmountWadsWithInterest(reserveCumulativeBorrowRateWads, obligationCumulativeBorrowRateWads, obligationBorrowAmountWads) {
    switch (reserveCumulativeBorrowRateWads.comparedTo(obligationCumulativeBorrowRateWads)) {
        case -1: {
            // less than
            console.error("Interest rate cannot be negative.\n        reserveCumulativeBorrowRateWadsNum: ".concat(reserveCumulativeBorrowRateWads.toString(), " |\n        obligationCumulativeBorrowRateWadsNum: ").concat(obligationCumulativeBorrowRateWads.toString()));
            return obligationBorrowAmountWads;
        }
        case 0: {
            // do nothing when equal
            return obligationBorrowAmountWads;
        }
        case 1: {
            // greater than
            var compoundInterestRate = reserveCumulativeBorrowRateWads.dividedBy(obligationCumulativeBorrowRateWads);
            return obligationBorrowAmountWads.multipliedBy(compoundInterestRate);
        }
        default: {
            console.log("Error: getBorrrowedAmountWadsWithInterest() identified invalid comparator.\n      reserveCumulativeBorrowRateWadsNum: ".concat(reserveCumulativeBorrowRateWads.toString(), " |\n      obligationCumulativeBorrowRateWadsNum: ").concat(obligationCumulativeBorrowRateWads.toString()));
            return obligationBorrowAmountWads;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmcmVzaE9ibGlnYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGlicy9yZWZyZXNoT2JsaWdhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSx3REFBd0Q7QUFDeEQsOERBQXFDO0FBQ3JDLHlDQUE2QztBQUU3QyxrREFFZ0M7QUFJbkIsUUFBQSwwQkFBMEIsR0FBRyxFQUFFLENBQUM7QUFFN0MsOEVBQThFO0FBQzlFLHNGQUFzRjtBQUN0RixtQ0FBbUM7QUFDbkMsU0FBZ0IsNEJBQTRCLENBQzFDLFVBQXNCLEVBQ3RCLFFBQVEsRUFDUixZQUFZO0lBRVosSUFBSSxjQUFjLEdBQUcsSUFBSSxzQkFBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RDLElBQUksYUFBYSxHQUFHLElBQUksc0JBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNyQyxJQUFJLGtCQUFrQixHQUFHLElBQUksc0JBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxQyxJQUFJLG9CQUFvQixHQUFHLElBQUksc0JBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1QyxJQUFNLFFBQVEsR0FBRyxFQUFlLENBQUM7SUFDakMsSUFBTSxPQUFPLEdBQUcsRUFBYyxDQUFDO0lBRS9CLFVBQVUsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQUMsT0FBNkI7UUFDeEQsSUFBTSxXQUFXLEdBQUcsSUFBQSxzQkFBUyxFQUFDLFlBQVksRUFBRSxFQUFFLGNBQWMsRUFBRSxPQUFPLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNuRyxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ2hCLE1BQU0seUNBQWtDLE9BQU8sQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLGtHQUErRixDQUFDO1NBQzFLO1FBQ08sSUFBQSxLQUFLLEdBQXVCLFdBQVcsTUFBbEMsRUFBRSxRQUFRLEdBQWEsV0FBVyxTQUF4QixFQUFFLE1BQU0s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