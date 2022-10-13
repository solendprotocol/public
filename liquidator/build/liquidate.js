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
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
var web3_js_1 = require("@solana/web3.js");
var dotenv_1 = __importDefault(require("dotenv"));
var obligation_1 = require("models/layouts/obligation");
var utils_1 = require("libs/utils");
var pyth_1 = require("libs/pyth");
var refreshObligation_1 = require("libs/refreshObligation");
var secret_1 = require("libs/secret");
var liquidateAndRedeem_1 = require("libs/actions/liquidateAndRedeem");
var rebalanceWallet_1 = require("libs/rebalanceWallet");
var core_1 = require("@jup-ag/core");
var unwrapToken_1 = require("libs/unwrap/unwrapToken");
var config_1 = require("./config");
dotenv_1.default.config();
function runLiquidator() {
    return __awaiter(this, void 0, void 0, function () {
        var rpcEndpoint, markets, connection, payer, jupiter, target, epoch, markets_1, markets_1_1, market, tokensOracle, allObligations, allReserves, allObligations_1, allObligations_1_1, obligation, _loop_1, state_1, err_1, e_1_1, walletBalances, e_2_1;
        var e_2, _a, e_1, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    rpcEndpoint = process.env.RPC_ENDPOINT;
                    if (!rpcEndpoint) {
                        throw new Error('Pls provide an private RPC endpoint in docker-compose.yaml');
                    }
                    return [4 /*yield*/, (0, config_1.getMarkets)()];
                case 1:
                    markets = _c.sent();
                    connection = new web3_js_1.Connection(rpcEndpoint, 'confirmed');
                    payer = new web3_js_1.Account(JSON.parse((0, secret_1.readSecret)('keypair')));
                    return [4 /*yield*/, core_1.Jupiter.load({
                            connection: connection,
                            cluster: 'mainnet-beta',
                            user: web3_js_1.Keypair.fromSecretKey(payer.secretKey),
                            wrapUnwrapSOL: false,
                        })];
                case 2:
                    jupiter = _c.sent();
                    target = (0, utils_1.getWalletDistTarget)();
                    console.log("\n    app: ".concat(process.env.APP, "\n    rpc: ").concat(rpcEndpoint, "\n    wallet: ").concat(payer.publicKey.toBase58(), "\n    auto-rebalancing: ").concat(target.length > 0 ? 'ON' : 'OFF', "\n    rebalancingDistribution: ").concat(process.env.TARGETS, "\n    \n    Running against ").concat(markets.length, " pools\n  "));
                    epoch = 0;
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 27, 28, 29]);
                    markets_1 = (e_2 = void 0, __values(markets)), markets_1_1 = markets_1.next();
                    _c.label = 4;
                case 4:
                    if (!!markets_1_1.done) return [3 /*break*/, 26];
                    market = markets_1_1.value;
                    return [4 /*yield*/, (0, pyth_1.getTokensOracleData)(connection, market)];
                case 5:
                    tokensOracle = _c.sent();
                    return [4 /*yield*/, (0, utils_1.getObligations)(connection, market.address)];
                case 6:
                    allObligations = _c.sent();
                    return [4 /*yield*/, (0, utils_1.getReserves)(connection, market.address)];
                case 7:
                    allReserves = _c.sent();
                    _c.label = 8;
                case 8:
                    _c.trys.push([8, 17, 18, 19]);
                    allObligations_1 = (e_1 = void 0, __values(allObligations)), allObligations_1_1 = allObligations_1.next();
                    _c.label = 9;
                case 9:
                    if (!!allObligations_1_1.done) return [3 /*break*/, 16];
                    obligation = allObligations_1_1.value;
                    _c.label = 10;
                case 10:
                    _c.trys.push([10, 14, , 15]);
                    _loop_1 = function () {
                        var _d, borrowedValue, unhealthyBorrowValue, deposits, borrows, selectedBorrow, selectedDeposit, balanceBase, postLiquidationObligation;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0:
                                    _d = (0, refreshObligation_1.calculateRefreshedObligation)(obligation.info, allReserves, tokensOracle), borrowedValue = _d.borrowedValue, unhealthyBorrowValue = _d.unhealthyBorrowValue, deposits = _d.deposits, borrows = _d.borrows;
                                    // Do nothing if obligation is healthy
                                    if (borrowedValue.isLessThanOrEqualTo(unhealthyBorrowValue)) {
                                        return [2 /*return*/, "break"];
                                    }
                                    borrows.forEach(function (borrow) {
                                        if (!selectedBorrow || borrow.marketValue.gt(selectedBorrow.marketValue)) {
                                            selectedBorrow = borrow;
                                        }
                                    });
                                    deposits.forEach(function (deposit) {
                                        if (!selectedDeposit || deposit.marketValue.gt(selectedDeposit.marketValue)) {
                                            selectedDeposit = deposit;
                                        }
                                    });
                                    if (!selectedBorrow || !selectedDeposit) {
                                        return [2 /*return*/, "break"];
                                    }
                                    console.log("Obligation ".concat(obligation.pubkey.toString(), " is underwater\n              borrowedValue: ").concat(borrowedValue.toString(), "\n              unhealthyBorrowValue: ").concat(unhealthyBorrowValue.toString(), "\n              market address: ").concat(market.address));
                                    return [4 /*yield*/, (0, utils_1.getWalletTokenData)(connection, market, payer, selectedBorrow.mintAddress, selectedBorrow.symbol)];
                                case 1:
                                    balanceBase = (_e.sent()).balanceBase;
                                    if (balanceBase === 0) {
                                        console.log("insufficient ".concat(selectedBorrow.symbol, " to liquidate obligation ").concat(obligation.pubkey.toString(), " in market: ").concat(market.address));
                                        return [2 /*return*/, "break"];
                                    }
                                    else if (balanceBase < 0) {
                                        console.log("failed to get wallet balance for ".concat(selectedBorrow.symbol, " to liquidate obligation ").concat(obligation.pubkey.toString(), " in market: ").concat(market.address, ". \n                Potentially network error or token account does not exist in wallet"));
                                        return [2 /*return*/, "break"];
                                    }
                                    // Set super high liquidation amount which acts as u64::MAX as program will only liquidate max
                                    // 50% val of all borrowed assets.
                                    return [4 /*yield*/, (0, liquidateAndRedeem_1.liquidateAndRedeem)(connection, payer, balanceBase, selectedBorrow.symbol, selectedDeposit.symbol, market, obligation)];
                                case 2:
                                    // Set super high liquidation amount which acts as u64::MAX as program will only liquidate max
                                    // 50% val of all borrowed assets.
                                    _e.sent();
                                    return [4 /*yield*/, connection.getAccountInfo(new web3_js_1.PublicKey(obligation.pubkey))];
                                case 3:
                                    postLiquidationObligation = _e.sent();
                                    obligation = (0, obligation_1.ObligationParser)(obligation.pubkey, postLiquidationObligation);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _c.label = 11;
                case 11:
                    if (!obligation) return [3 /*break*/, 13];
                    return [5 /*yield**/, _loop_1()];
                case 12:
                    state_1 = _c.sent();
                    if (state_1 === "break")
                        return [3 /*break*/, 13];
                    return [3 /*break*/, 11];
                case 13: return [3 /*break*/, 15];
                case 14:
                    err_1 = _c.sent();
                    console.error("error liquidating ".concat(obligation.pubkey.toString(), ": "), err_1);
                    return [3 /*break*/, 15];
                case 15:
                    allObligations_1_1 = allObligations_1.next();
                    return [3 /*break*/, 9];
                case 16: return [3 /*break*/, 19];
                case 17:
                    e_1_1 = _c.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 19];
                case 18:
                    try {
                        if (allObligations_1_1 && !allObligations_1_1.done && (_b = allObligations_1.return)) _b.call(allObligations_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                    return [7 /*endfinally*/];
                case 19: return [4 /*yield*/, (0, unwrapToken_1.unwrapTokens)(connection, payer)];
                case 20:
                    _c.sent();
                    if (!(target.length > 0)) return [3 /*break*/, 23];
                    return [4 /*yield*/, (0, utils_1.getWalletBalances)(connection, payer, tokensOracle, market)];
                case 21:
                    walletBalances = _c.sent();
                    return [4 /*yield*/, (0, rebalanceWallet_1.rebalanceWallet)(connection, payer, jupiter, tokensOracle, walletBalances, target)];
                case 22:
                    _c.sent();
                    _c.label = 23;
                case 23:
                    if (!process.env.THROTTLE) return [3 /*break*/, 25];
                    return [4 /*yield*/, (0, utils_1.wait)(Number(process.env.THROTTLE))];
                case 24:
                    _c.sent();
                    _c.label = 25;
                case 25:
                    markets_1_1 = markets_1.next();
                    return [3 /*break*/, 4];
                case 26: return [3 /*break*/, 29];
                case 27:
                    e_2_1 = _c.sent();
                    e_2 = { error: e_2_1 };
                    return [3 /*break*/, 29];
                case 28:
                    try {
                        if (markets_1_1 && !markets_1_1.done && (_a = markets_1.return)) _a.call(markets_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                    return [7 /*endfinally*/];
                case 29:
                    epoch += 1;
                    return [3 /*break*/, 3];
                case 30: return [2 /*return*/];
            }
        });
    });
}
runLiquidator();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlxdWlkYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpcXVpZGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0NBQWdDO0FBQ2hDLHlDQUF5QztBQUN6QywyQ0FLeUI7QUFDekIsa0RBQTRCO0FBQzVCLHdEQUE2RDtBQUM3RCxvQ0FFb0I7QUFDcEIsa0NBQWdEO0FBQ2hELDREQUFzRTtBQUN0RSxzQ0FBeUM7QUFDekMsc0VBQXFFO0FBQ3JFLHdEQUF1RDtBQUN2RCxxQ0FBdUM7QUFDdkMsdURBQXVEO0FBQ3ZELG1DQUFzQztBQUV0QyxnQkFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRWhCLFNBQWUsYUFBYTs7Ozs7OztvQkFDcEIsV0FBVyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDO29CQUM3QyxJQUFJLENBQUMsV0FBVyxFQUFFO3dCQUNoQixNQUFNLElBQUksS0FBSyxDQUFDLDREQUE0RCxDQUFDLENBQUM7cUJBQy9FO29CQUNlLHFCQUFNLElBQUEsbUJBQVUsR0FBRSxFQUFBOztvQkFBNUIsT0FBTyxHQUFHLFNBQWtCO29CQUM1QixVQUFVLEdBQUcsSUFBSSxvQkFBVSxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztvQkFFdEQsS0FBSyxHQUFHLElBQUksaUJBQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUEsbUJBQVUsRUFBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzdDLHFCQUFNLGNBQU8sQ0FBQyxJQUFJLENBQUM7NEJBQ2pDLFVBQVUsWUFBQTs0QkFDVixPQUFPLEVBQUUsY0FBYzs0QkFDdkIsSUFBSSxFQUFFLGlCQUFPLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUM7NEJBQzVDLGFBQWEsRUFBRSxLQUFLO3lCQUNyQixDQUFDLEVBQUE7O29C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