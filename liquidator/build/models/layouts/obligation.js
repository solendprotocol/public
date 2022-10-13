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
exports.ObligationParser = exports.isObligation = exports.ObligationLiquidityLayout = exports.ObligationCollateralLayout = exports.ObligationLayout = exports.obligationToString = exports.OBLIGATION_LEN = void 0;
var bn_js_1 = __importDefault(require("bn.js"));
var BufferLayout = __importStar(require("buffer-layout"));
var Layout = __importStar(require("libs/layout"));
var lastUpdate_1 = require("./lastUpdate");
exports.OBLIGATION_LEN = 1300;
// BN defines toJSON property, which messes up serialization
// @ts-ignore
bn_js_1.default.prototype.toJSON = undefined;
function obligationToString(obligation) {
    return JSON.stringify(obligation, function (key, value) {
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
exports.obligationToString = obligationToString;
exports.ObligationLayout = BufferLayout.struct([
    BufferLayout.u8('version'),
    lastUpdate_1.LastUpdateLayout,
    Layout.publicKey('lendingMarket'),
    Layout.publicKey('owner'),
    Layout.uint128('depositedValue'),
    Layout.uint128('borrowedValue'),
    Layout.uint128('allowedBorrowValue'),
    Layout.uint128('unhealthyBorrowValue'),
    BufferLayout.blob(64, '_padding'),
    BufferLayout.u8('depositsLen'),
    BufferLayout.u8('borrowsLen'),
    BufferLayout.blob(1096, 'dataFlat'),
]);
exports.ObligationCollateralLayout = BufferLayout.struct([
    Layout.publicKey('depositReserve'),
    Layout.uint64('depositedAmount'),
    Layout.uint128('marketValue'),
    BufferLayout.blob(32, 'padding'),
]);
exports.ObligationLiquidityLayout = BufferLayout.struct([
    Layout.publicKey('borrowReserve'),
    Layout.uint128('cumulativeBorrowRateWads'),
    Layout.uint128('borrowedAmountWads'),
    Layout.uint128('marketValue'),
    BufferLayout.blob(32, 'padding'),
]);
var isObligation = function (info) { return info.data.length === exports.ObligationLayout.span; };
exports.isObligation = isObligation;
var ObligationParser = function (pubkey, info) {
    var buffer = Buffer.from(info.data);
    var _a = exports.ObligationLayout.decode(buffer), version = _a.version, lastUpdate = _a.lastUpdate, lendingMarket = _a.lendingMarket, owner = _a.owner, depositedValue = _a.depositedValue, borrowedValue = _a.borrowedValue, allowedBorrowValue = _a.allowedBorrowValue, unhealthyBorrowValue = _a.unhealthyBorrowValue, depositsLen = _a.depositsLen, borrowsLen = _a.borrowsLen, dataFlat = _a.dataFlat;
    if (lastUpdate.slot.isZero()) {
        return null;
    }
    var depositsBuffer = dataFlat.slice(0, depositsLen * exports.ObligationCollateralLayout.span);
    var deposits = BufferLayout.seq(exports.ObligationCollateralLayout, depositsLen).decode(depositsBuffer);
    var borrowsBuffer = dataFlat.slice(depositsBuffer.length, depositsLen * exports.ObligationCollateralLayout.span
        + borrowsLen * exports.ObligationLiquidityLayout.span);
    var borrows = BufferLayout.seq(exports.ObligationLiquidityLayout, borrowsLen).decode(borrowsBuffer);
    var obligation = {
        version: version,
        lastUpdate: lastUpdate,
        lendingMarket: lendingMarket,
        owner: owner,
        depositedValue: depositedValue,
        borrowedValue: borrowedValue,
        allowedBorrowValue: allowedBorrowValue,
        unhealthyBorrowValue: unhealthyBorrowValue,
        deposits: deposits,
        borrows: borrows,
    };
    var details = {
        pubkey: pubkey,
        account: __assign({}, info),
        info: obligation,
    };
    return details;
};
exports.ObligationParser = ObligationParser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JsaWdhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tb2RlbHMvbGF5b3V0cy9vYmxpZ2F0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSxnREFBdUI7QUFDdkIsMERBQThDO0FBQzlDLGtEQUFzQztBQUN0QywyQ0FBNEQ7QUFFL0MsUUFBQSxjQUFjLEdBQUcsSUFBSSxDQUFDO0FBaUJuQyw0REFBNEQ7QUFDNUQsYUFBYTtBQUNiLGVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQztBQUVoQyxTQUFnQixrQkFBa0IsQ0FBQyxVQUFzQjtJQUN2RCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQ25CLFVBQVUsRUFDVixVQUFDLEdBQUcsRUFBRSxLQUFLO1FBQ1QsUUFBUSxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRTtZQUM5QixLQUFLLFdBQVc7Z0JBQ2QsT0FBTyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJO2dCQUNQLE9BQU8sS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzFCO2dCQUNFLE9BQU8sS0FBSyxDQUFDO1NBQ2hCO0lBQ0gsQ0FBQyxFQUNELENBQUMsQ0FDRixDQUFDO0FBQ0osQ0FBQztBQWZELGdEQWVDO0FBZVksUUFBQSxnQkFBZ0IsR0FBa0MsWUFBWSxDQUFDLE1BQU0sQ0FBQztJQUNqRixZQUFZLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQztJQUUxQiw2QkFBZ0I7SUFFaEIsTUFBTSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUM7SUFDakMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUM7SUFDekIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQztJQUNoQyxNQUFNLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQztJQUMvQixNQUFNLENBQUMsT0FB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