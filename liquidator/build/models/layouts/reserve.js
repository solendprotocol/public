"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
exports.getLiquidationThresholdRate = exports.getLoanToValueRate = exports.getCollateralExchangeRate = exports.ReserveParser = exports.isReserve = exports.ReserveLayout = exports.WAD = exports.RESERVE_LEN = void 0;
var BufferLayout = __importStar(require("buffer-layout"));
var Layout = __importStar(require("libs/layout"));
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var lastUpdate_1 = require("./lastUpdate");
exports.RESERVE_LEN = 619;
exports.WAD = new bignumber_js_1.default(1000000000000000000);
var INITIAL_COLLATERAL_RATIO = 1;
var INITIAL_COLLATERAL_RATE = new bignumber_js_1.default(INITIAL_COLLATERAL_RATIO).multipliedBy(exports.WAD);
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
var isReserve = function (info) { return info.data.length === exports.ReserveLayout.span; };
exports.isReserve = isReserve;
var ReserveParser = function (pubkey, info) {
    var buffer = Buffer.from(info.data);
    var reserve = exports.ReserveLayout.decode(buffer);
    if (reserve.lastUpdate.slot.isZero()) {
        return null;
    }
    var details = {
        pubkey: pubkey,
        account: __assign({}, info),
        info: reserve,
    };
    return details;
};
exports.ReserveParser = ReserveParser;
var getCollateralExchangeRate = function (reserve) {
    var totalLiquidity = (new bignumber_js_1.default(reserve.liquidity.availableAmount.toString()).multipliedBy(exports.WAD))
        .plus(new bignumber_js_1.default(reserve.liquidity.borrowedAmountWads.toString()));
    var collateral = reserve.collateral;
    var rate;
    if (collateral.mintTotalSupply.isZero() || totalLiquidity.isZero()) {
        rate = INITIAL_COLLATERAL_RATE;
    }
    else {
        var mintTotalSupply = collateral.mintTotalSupply;
        rate = (new bignumber_js_1.default(mintTotalSupply.toString()).multipliedBy(exports.WAD))
            .dividedBy(new bignumber_js_1.default(totalLiquidity.toString()));
    }
    return rate;
};
exports.getCollateralExchangeRate = getCollateralExchangeRate;
var getLoanToValueRate = function (reserve) { return new bignumber_js_1.default(reserve.config.loanToValueRatio / 100); };
exports.getLoanToValueRate = getLoanToValueRate;
var getLiquidationThresholdRate = function (reserve) { return new bignumber_js_1.default(reserve.config.liquidationThreshold / 100); };
exports.getLiquidationThresholdRate = getLiquidationThresholdRate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzZXJ2ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tb2RlbHMvbGF5b3V0cy9yZXNlcnZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSwwREFBOEM7QUFDOUMsa0RBQXNDO0FBQ3RDLDhEQUFxQztBQUNyQywyQ0FBNEQ7QUFFL0MsUUFBQSxXQUFXLEdBQUcsR0FBRyxDQUFDO0FBQ2xCLFFBQUEsR0FBRyxHQUFHLElBQUksc0JBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBRXRELElBQU0sd0JBQXdCLEdBQUcsQ0FBQyxDQUFDO0FBQ25DLElBQU0sdUJBQXVCLEdBQUcsSUFBSSxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLENBQUMsWUFBWSxDQUFDLFdBQUcsQ0FBQyxDQUFDO0FBNkM3RSxRQUFBLGFBQWEsR0FBa0MsWUFBWSxDQUFDLE1BQU0sQ0FDN0U7SUFDRSxZQUFZLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQztJQUUxQiw2QkFBZ0I7SUFFaEIsTUFBTSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUM7SUFFakMsWUFBWSxDQUFDLE1BQU0sQ0FDakI7UUFDRSxNQUFNLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQztRQUM5QixZQUFZLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQztRQUMvQixNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQztRQUNoQyx3QkFBd0I7UUFDeEIsbURBQW1EO1FBQ25ELG9DQUFvQztRQUNwQyxNQUFNLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQztRQUM5QixNQUFNLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDO1FBQ3JDLE1BQU0sQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUM7UUFDaEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQztRQUNwQyxNQUFNLENBQUMsT0FBTyxDQUFDLDBCQUEwQixD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