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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWalletDistTarget = exports.getWalletBalance = exports.findAssociatedTokenAddress = exports.getWalletTokenData = exports.getWalletBalances = exports.getReserves = exports.getObligations = exports.getProgramIdForCurrentDeployment = exports.wait = exports.getTokenInfoFromMarket = exports.getTokenInfo = exports.toBaseUnit = exports.toHuman = exports.U64_MAX = exports.WAD = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-restricted-syntax */
var spl_token_1 = require("@solana/spl-token");
var web3_js_1 = require("@solana/web3.js");
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var obligation_1 = require("models/layouts/obligation");
var reserve_1 = require("models/layouts/reserve");
var underscore_1 = require("underscore");
exports.WAD = new bignumber_js_1.default("1".concat(''.padEnd(18, '0')));
exports.U64_MAX = '18446744073709551615';
// Converts amount to human (rebase with decimals)
function toHuman(market, amount, symbol) {
    var decimals = getDecimals(market, symbol);
    return toHumanDec(amount, decimals);
}
exports.toHuman = toHuman;
function toBaseUnit(market, amount, symbol) {
    if (amount === exports.U64_MAX)
        return amount;
    var decimals = getDecimals(market, symbol);
    return toBaseUnitDec(amount, decimals);
}
exports.toBaseUnit = toBaseUnit;
// Converts to base unit amount
// e.g. 1.0 SOL => 1000000000 (lamports)
function toBaseUnitDec(amount, decimals) {
    if (decimals < 0) {
        throw new Error("Invalid decimal ".concat(decimals));
    }
    if ((amount.match(/\./g) || []).length > 1) {
        throw new Error('Too many decimal points');
    }
    var decimalIndex = amount.indexOf('.');
    var precision;
    if (decimalIndex === -1) {
        precision = 0;
        decimalIndex = amount.length; // Pretend it's at the end
    }
    else {
        precision = amount.length - decimalIndex - 1;
    }
    if (precision === decimals) {
        return amount.slice(0, decimalIndex) + amount.slice(decimalIndex + 1);
    }
    if (precision < decimals) {
        var numTrailingZeros = decimals - precision;
        return (amount.slice(0, decimalIndex)
            + amount.slice(decimalIndex + 1)
            + ''.padEnd(numTrailingZeros, '0'));
    }
    return (amount.slice(0, decimalIndex)
        + amount.slice(decimalIndex + 1, decimalIndex + decimals + 1));
}
function getDecimals(market, symbol) {
    var tokenInfo = getTokenInfo(market, symbol);
    return tokenInfo.decimals;
}
// Returns token info from config
function getTokenInfo(market, symbol) {
    var tokenInfo = (0, underscore_1.findWhere)(market.reserves.map(function (reserve) { return reserve.liquidityToken; }), { symbol: symbol });
    if (!tokenInfo) {
        throw new Error("Could not find ".concat(symbol, " in config.assets"));
    }
    return tokenInfo;
}
exports.getTokenInfo = getTokenInfo;
function getTokenInfoFromMarket(market, symbol) {
    var liquidityToken = (0, underscore_1.findWhere)(market.reserves.map(function (reserve) { return reserve.liquidityToken; }), { symbol: symbol });
    if (!liquidityToken) {
        throw new Error("Could not find ".concat(symbol, " in config.assets"));
    }
    return {
        name: liquidityToken.name,
        symbol: liquidityToken.symbol,
        decimals: liquidityToken.decimals,
        mintAddress: liquidityToken.mint,
        logo: liquidityToken.logo,
    };
}
exports.getTokenInfoFromMarket = getTokenInfoFromMarket;
function wait(ms) {
    return new Promise(function (res) { return setTimeout(res, ms); });
}
exports.wait = wait;
function toHumanDec(amount, decimals) {
    var amountStr = amount.slice(amount.length - Math.min(decimals, amount.length));
    if (decimals > amount.length) {
        for (var i = 0; i < decimals - amount.length; i += 1) {
            amountStr = "0".concat(amountStr);
        }
        amountStr = "0.".concat(amountStr);
    }
    else {
        amountStr = ".".concat(amountStr);
        for (var i = amount.length - decimals - 1; i >= 0; i -= 1) {
            amountStr = amount[i] + amountStr;
        }
    }
    amountStr = stripEnd(amountStr, '0');
    amountStr = stripEnd(amountStr, '.');
    return amountStr;
}
// Strips character c from end of string s
function stripEnd(s, c) {
    var i = s.length - 1;
    for (; i >= 0; i -= 1) {
        if (s[i] !== c) {
            break;
        }
    }
    return s.slice(0, i + 1);
}
function getProgramIdForCurrentDeployment() {
    return {
        beta: 'BLendhFh4HGnycEDDFhbeFEUYLP4fXB5tTHMoTX8Dch5',
        production: 'So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo',
        staging: 'ALend7Ketfx5bxh6ghsCDXAoDrhvEmsXT3cynB6aPLgx',
    }[process.env.APP || 'production'] || 'So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo';
}
exports.getProgramIdForCurrentDeployment = getProgramIdForCurrentDeployment;
function getObligations(connection, lendingMarketAddr) {
    return __awaiter(this, void 0, void 0, function () {
        var programID, resp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    programID = getProgramIdForCurrentDeployment();
                    return [4 /*yield*/, connection.getProgramAccounts(new web3_js_1.PublicKey(programID), {
                            commitment: connection.commitment,
                            filters: [
                                {
                                    memcmp: {
                                        offset: 10,
                                        bytes: lendingMarketAddr,
                                    },
                                },
                                {
                                    dataSize: obligation_1.OBLIGATION_LEN,
                                }
                            ],
                            encoding: 'base64',
                        })];
                case 1:
                    resp = _a.sent();
                    return [2 /*return*/, resp.map(function (account) { return (0, obligation_1.ObligationParser)(account.pubkey, account.account); })];
            }
        });
    });
}
exports.getObligations = getObligations;
function getReserves(connection, lendingMarketAddr) {
    return __awaiter(this, void 0, void 0, function () {
        var programID, resp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    programID = getProgramIdForCurrentDeployment();
                    return [4 /*yield*/, connection.getProgramAccounts(new web3_js_1.PublicKey(programID), {
                            commitment: connection.commitment,
                            filters: [
                                {
                                    memcmp: {
                                        offset: 10,
                                        bytes: lendingMarketAddr,
                                    },
                                },
                                {
                                    dataSize: reserve_1.RESERVE_LEN,
                                },
                            ],
                            encoding: 'base64',
                        })];
                case 1:
                    resp = _a.sent();
                    return [2 /*return*/, resp.map(function (account) { return (0, reserve_1.ReserveParser)(account.pubkey, account.account); })];
            }
        });
    });
}
exports.getReserves = getReserves;
function getWalletBalances(connection, wallet, tokensOracle, market) {
    return __awaiter(this, void 0, void 0, function () {
        var promises, _a, _b, _c, key, value, tokenOracleData, walletBalances;
        var e_1, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    promises = [];
                    try {
                        for (_a = __values(Object.entries(tokensOracle)), _b = _a.next(); !_b.done; _b = _a.next()) {
                            _c = __read(_b.value, 2), key = _c[0], value = _c[1];
                            if (value) {
                                tokenOracleData = value;
                                promises.push(getWalletTokenData(connection, market, wallet, tokenOracleData.mintAddress, tokenOracleData.symbol));
                            }
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    return [4 /*yield*/, Promise.all(promises)];
                case 1:
                    walletBalances = _e.sent();
                    return [2 /*return*/, walletBalances];
            }
        });
    });
}
exports.getWalletBalances = getWalletBalances;
function getWalletTokenData(connection, market, wallet, mintAddress, symbol) {
    return __awaiter(this, void 0, void 0, function () {
        var token, userTokenAccount, result, balance, balanceBase, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    token = new spl_token_1.Token(connection, new web3_js_1.PublicKey(mintAddress), spl_token_1.TOKEN_PROGRAM_ID, wallet.publicKey);
                    return [4 /*yield*/, spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey(mintAddress), wallet.publicKey)];
                case 1:
                    userTokenAccount = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, token.getAccountInfo(userTokenAccount)];
                case 3:
                    result = _a.sent();
                    balance = toHuman(market, result.amount.toString(), symbol);
                    balanceBase = result.amount.toString();
                    return [2 /*return*/, {
                            balance: Number(balance),
                            balanceBase: Number(balanceBase),
                            symbol: symbol,
                        }];
                case 4:
                    e_2 = _a.sent();
                    return [2 /*return*/, {
                            balance: -1,
                            balanceBase: -1,
                            symbol: symbol,
                        }];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.getWalletTokenData = getWalletTokenData;
var findAssociatedTokenAddress = function (walletAddress, tokenMintAddress) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, web3_js_1.PublicKey.findProgramAddress([walletAddress.toBuffer(), spl_token_1.TOKEN_PROGRAM_ID.toBuffer(), tokenMintAddress.toBuffer()], spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID)];
            case 1: return [2 /*return*/, (_a.sent())[0]];
        }
    });
}); };
exports.findAssociatedTokenAddress = findAssociatedTokenAddress;
var getWalletBalance = function (connection, mint, walletAddress) { return __awaiter(void 0, void 0, void 0, function () {
    var userAta;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, exports.findAssociatedTokenAddress)(walletAddress, mint)];
            case 1:
                userAta = _a.sent();
                return [2 /*return*/, connection
                        .getTokenAccountBalance(userAta)
                        .then(function (tokenAmount) {
                        var _a;
                        if (parseFloat((_a = tokenAmount === null || tokenAmount === void 0 ? void 0 : tokenAmount.value) === null || _a === void 0 ? void 0 : _a.amount)) {
                            return parseFloat(tokenAmount.value.amount);
                        }
                        return 0;
                    })
                        .catch(function (error) { return 0; })];
        }
    });
}); };
exports.getWalletBalance = getWalletBalance;
function getWalletDistTarget() {
    var e_3, _a;
    var target = [];
    var targetRaw = process.env.TARGETS || '';
    var targetDistributions = targetRaw.split(' ');
    try {
        for (var targetDistributions_1 = __values(targetDistributions), targetDistributions_1_1 = targetDistributions_1.next(); !targetDistributions_1_1.done; targetDistributions_1_1 = targetDistributions_1.next()) {
            var dist = targetDistributions_1_1.value;
            var tokens = dist.split(':');
            var asset = tokens[0];
            var unitAmount = tokens[1];
            target.push({ symbol: asset, target: parseFloat(unitAmount) });
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (targetDistributions_1_1 && !targetDistributions_1_1.done && (_a = targetDistributions_1.return)) _a.call(targetDistributions_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
    return target;
}
exports.getWalletDistTarget = getWalletDistTarget;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGlicy91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxzREFBc0Q7QUFDdEQseUNBQXlDO0FBQ3pDLCtDQUF5RjtBQUN6RiwyQ0FBd0Q7QUFDeEQsOERBQXFDO0FBSXJDLHdEQUVtQztBQUNuQyxrREFBb0U7QUFDcEUseUNBQXVDO0FBRzFCLFFBQUEsR0FBRyxHQUFHLElBQUksc0JBQVMsQ0FBQyxXQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFFLENBQUMsQ0FBQztBQUM5QyxRQUFBLE9BQU8sR0FBRyxzQkFBc0IsQ0FBQztBQUU5QyxrREFBa0Q7QUFDbEQsU0FBZ0IsT0FBTyxDQUFDLE1BQW9CLEVBQUUsTUFBYyxFQUFFLE1BQWM7SUFDMUUsSUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUM3QyxPQUFPLFVBQVUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDdEMsQ0FBQztBQUhELDBCQUdDO0FBRUQsU0FBZ0IsVUFBVSxDQUFDLE1BQW9CLEVBQUUsTUFBYyxFQUFFLE1BQWM7SUFDN0UsSUFBSSxNQUFNLEtBQUssZUFBTztRQUFFLE9BQU8sTUFBTSxDQUFDO0lBQ3RDLElBQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDN0MsT0FBTyxhQUFhLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3pDLENBQUM7QUFKRCxnQ0FJQztBQUVELCtCQUErQjtBQUMvQix3Q0FBd0M7QUFDeEMsU0FBUyxhQUFhLENBQUMsTUFBYyxFQUFFLFFBQWdCO0lBQ3JELElBQUksUUFBUSxHQUFHLENBQUMs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