"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebalanceWallet = void 0;
/* eslint-disable no-lonely-if */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
var underscore_1 = require("underscore");
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var spl_token_1 = require("@solana/spl-token");
var web3_js_1 = require("@solana/web3.js");
var swap_1 = __importDefault(require("./swap"));
// Padding so we rebalance only when abs(target-actual)/target is greater than PADDING
var PADDING = Number(process.env.REBALANCE_PADDING) || 0.2;
function rebalanceWallet(connection, payer, jupiter, tokensOracle, walletBalances, target) {
    return __awaiter(this, void 0, void 0, function () {
        var info, info_1, info_1_1, tokenInfo, fromTokenInfo, toTokenInfo, amount, USDCTokenInfo, error_1, e_1_1;
        var e_1, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, aggregateInfo(tokensOracle, walletBalances, connection, payer, target)];
                case 1:
                    info = _b.sent();
                    // calculate token diff between current & target value
                    info.forEach(function (tokenInfo) {
                        tokenInfo.diff = tokenInfo.balance - tokenInfo.target;
                        tokenInfo.diffUSD = tokenInfo.diff * tokenInfo.price;
                    });
                    // Sort in decreasing order so we sell first then buy
                    info.sort(function (a, b) { return b.diffUSD - a.diffUSD; });
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 9, 10, 11]);
                    info_1 = __values(info), info_1_1 = info_1.next();
                    _b.label = 3;
                case 3:
                    if (!!info_1_1.done) return [3 /*break*/, 8];
                    tokenInfo = info_1_1.value;
                    // skip usdc since it is our base currency
                    if (tokenInfo.symbol === 'USDC') {
                        return [3 /*break*/, 7];
                    }
                    // skip if exchange amount is too little
                    if (Math.abs(tokenInfo.diff) <= PADDING * tokenInfo.target) {
                        return [3 /*break*/, 7];
                    }
                    fromTokenInfo = void 0;
                    toTokenInfo = void 0;
                    amount = void 0;
                    USDCTokenInfo = (0, underscore_1.findWhere)(info, { symbol: 'USDC' });
                    if (!USDCTokenInfo) {
                        console.error('failed to find USDC token info');
                    }
                    // negative diff means we need to buy
                    if (tokenInfo.diff < 0) {
                        fromTokenInfo = USDCTokenInfo;
                        toTokenInfo = tokenInfo;
                        amount = (new bignumber_js_1.default(tokenInfo.diffUSD).multipliedBy(fromTokenInfo.decimals)).abs();
                        // positive diff means we sell
                    }
                    else {
                        fromTokenInfo = tokenInfo;
                        toTokenInfo = USDCTokenInfo;
                        amount = new bignumber_js_1.default(tokenInfo.diff).multipliedBy(fromTokenInfo.decimals);
                    }
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, (0, swap_1.default)(connection, payer, jupiter, fromTokenInfo, toTokenInfo, Math.floor(amount.toNumber()))];
                case 5:
                    _b.sent();
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _b.sent();
                    console.error({ error: error_1 }, 'failed to swap tokens');
                    return [3 /*break*/, 7];
                case 7:
                    info_1_1 = info_1.next();
                    return [3 /*break*/, 3];
                case 8: return [3 /*break*/, 11];
                case 9:
                    e_1_1 = _b.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 11];
                case 10:
                    try {
                        if (info_1_1 && !info_1_1.done && (_a = info_1.return)) _a.call(info_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    });
}
exports.rebalanceWallet = rebalanceWallet;
function aggregateInfo(tokensOracle, walletBalances, connection, wallet, target) {
    var _this = this;
    var info = [];
    target.forEach(function (tokenDistribution) { return __awaiter(_this, void 0, void 0, function () {
        var symbol, target, tokenOracle, walletBalance, token, ata, usdValue;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    symbol = tokenDistribution.symbol, target = tokenDistribution.target;
                    tokenOracle = (0, underscore_1.findWhere)(tokensOracle, { symbol: symbol });
                    walletBalance = (0, underscore_1.findWhere)(walletBalances, { symbol: symbol });
                    if (!walletBalance) return [3 /*break*/, 3];
                    if (!(walletBalance.balance === -1)) return [3 /*break*/, 2];
                    token = new spl_token_1.Token(connection, new web3_js_1.PublicKey(tokenOracle.mintAddress), spl_token_1.TOKEN_PROGRAM_ID, wallet);
                    return [4 /*yield*/, token.createAssociatedTokenAccount(wallet.publicKey)];
                case 1:
                    ata = _b.sent();
                    walletBalance.ata = ata.toString();
                    walletBalance.balance = 0;
                    _b.label = 2;
                case 2:
                    usdValue = new bignumber_js_1.default(walletBalance.balance).multipliedBy(tokenOracle.price);
                    info.push({
                        symbol: symbol,
                        target: target,
                        mintAddress: tokenOracle.mintAddress,
                        ata: (_a = walletBalance.ata) === null || _a === void 0 ? void 0 : _a.toString(),
                        balance: walletBalance.balance,
                        usdValue: usdValue.toNumber(),
                        price: tokenOracle.price.toNumber(),
                        decimals: tokenOracle.decimals,
                        reserveAddress: tokenOracle.reserveAddress,
                    });
                    _b.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); });
    return info;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmViYWxhbmNlV2FsbGV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpYnMvcmViYWxhbmNlV2FsbGV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaUNBQWlDO0FBQ2pDLGdDQUFnQztBQUNoQyx5Q0FBeUM7QUFDekMsc0NBQXNDO0FBQ3RDLHlDQUF1QztBQUN2Qyw4REFBcUM7QUFDckMsK0NBQTREO0FBQzVELDJDQUE0QztBQUU1QyxnREFBMEI7QUFFMUIsc0ZBQXNGO0FBQ3RGLElBQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLElBQUksR0FBRyxDQUFDO0FBRTdELFNBQXNCLGVBQWUsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsY0FBYyxFQUFFLE1BQU07Ozs7Ozt3QkFDdkYscUJBQU0sYUFBYSxDQUFDLFlBQVksRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsRUFBQTs7b0JBQW5GLElBQUksR0FBRyxTQUE0RTtvQkFDekYsc0RBQXNEO29CQUN0RCxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQUMsU0FBUzt3QkFDckIsU0FBUyxDQUFDLElBQUksR0FBRyxTQUFTLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUM7d0JBQ3RELFNBQVMsQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDLElBQUksR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDO29CQUN2RCxDQUFDLENBQUMsQ0FBQztvQkFFSCxxREFBcUQ7b0JBQ3JELElBQUksQ0FBQyxJQUFJLENBQUMsVUFBQyxDQUFDLEVBQUUsQ0FBQyxJQUFLLE9BQUEsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFyQixDQUFxQixDQUFD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