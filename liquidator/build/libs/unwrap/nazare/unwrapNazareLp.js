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
Object.defineProperty(exports, "__esModule", { value: true });
exports.unwrapNazareLp = exports.getNazareTokenMints = exports.checkAndUnwrapNLPTokens = exports.NAZARE_PROGRAM_ID = void 0;
/* eslint-disable no-restricted-syntax */
var web3_js_1 = require("@solana/web3.js");
var ggoldca_sdk_1 = require("ggoldca-sdk");
var provider_1 = require("@project-serum/anchor/dist/cjs/provider");
var anchor_1 = require("@project-serum/anchor");
var spl_token_v2_1 = require("@solana/spl-token-v2");
var utils_1 = require("libs/utils");
var ggoldca_1 = require("./ggoldca");
exports.NAZARE_PROGRAM_ID = new web3_js_1.PublicKey('NAZAREQQuCnkV8CpkGZaoB6ccmvikM8uRr4GKPWwmPT');
function NazareProgram(connection, wallet) {
    var provider = new provider_1.AnchorProvider(connection, wallet, {
        skipPreflight: false,
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
    });
    return new anchor_1.Program(ggoldca_1.IDL, exports.NAZARE_PROGRAM_ID, provider);
}
function getNazareVaultData(program, mint) {
    return __awaiter(this, void 0, void 0, function () {
        var allVaults, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, program.account.vaultAccount.all()];
                case 1:
                    allVaults = _a.sent();
                    allVaults.forEach(function (vaultData) {
                        var _a = __read(web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('mint'), vaultData.publicKey.toBuffer()], exports.NAZARE_PROGRAM_ID), 2), vaultLpTokenMintPubkey = _a[0], _bumpLp = _a[1];
                        if (vaultLpTokenMintPubkey.toString() === mint.toString()) {
                            result = vaultData;
                        }
                    });
                    return [2 /*return*/, result];
            }
        });
    });
}
var checkAndUnwrapNLPTokens = function (connection, payer) { return __awaiter(void 0, void 0, void 0, function () {
    var nazareMints, nazareMints_1, nazareMints_1_1, mint, tokenAmount, e_1_1;
    var e_1, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, (0, exports.getNazareTokenMints)(connection)];
            case 1:
                nazareMints = _b.sent();
                _b.label = 2;
            case 2:
                _b.trys.push([2, 8, 9, 10]);
                nazareMints_1 = __values(nazareMints), nazareMints_1_1 = nazareMints_1.next();
                _b.label = 3;
            case 3:
                if (!!nazareMints_1_1.done) return [3 /*break*/, 7];
                mint = nazareMints_1_1.value;
                return [4 /*yield*/, (0, utils_1.getWalletBalance)(connection, mint, payer.publicKey)];
            case 4:
                tokenAmount = _b.sent();
                if (!tokenAmount) return [3 /*break*/, 6];
                return [4 /*yield*/, (0, exports.unwrapNazareLp)(connection, payer, mint, tokenAmount)];
            case 5:
                _b.sent();
                _b.label = 6;
            case 6:
                nazareMints_1_1 = nazareMints_1.next();
                return [3 /*break*/, 3];
            case 7: return [3 /*break*/, 10];
            case 8:
                e_1_1 = _b.sent();
                e_1 = { error: e_1_1 };
                return [3 /*break*/, 10];
            case 9:
                try {
                    if (nazareMints_1_1 && !nazareMints_1_1.done && (_a = nazareMints_1.return)) _a.call(nazareMints_1);
                }
                finally { if (e_1) throw e_1.error; }
                return [7 /*endfinally*/];
            case 10: return [2 /*return*/];
        }
    });
}); };
exports.checkAndUnwrapNLPTokens = checkAndUnwrapNLPTokens;
var getNazareTokenMints = function (connection) { return __awaiter(void 0, void 0, void 0, function () {
    var program, allVaults, vaultPubKeys;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                program = NazareProgram(connection, anchor_1.Wallet);
                return [4 /*yield*/, program.account.vaultAccount.all()];
            case 1:
                allVaults = _a.sent();
                return [4 /*yield*/, Promise.all(allVaults.map(function (vaultData) { return vaultData.publicKey; }))];
            case 2:
                vaultPubKeys = _a.sent();
                return [2 /*return*/, vaultPubKeys.map(function (publicKey) {
                        var _a = __read(web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('mint'), publicKey.toBuffer()], exports.NAZARE_PROGRAM_ID), 2), vaultLpTokenMintPubkey = _a[0], _bumpLp = _a[1];
                        return vaultLpTokenMintPubkey;
                    })];
        }
    });
}); };
exports.getNazareTokenMints = getNazareTokenMints;
var unwrapNazareLp = function (connection, payer, mint, lpAmount) { return __awaiter(void 0, void 0, void 0, function () {
    var program, vaultData, vaultId, ggClient, userTokenAAccount, userTokenBAccount, userTokenAAccountData, userTokenBAccountData, _a, blockhash, lastValidBlockHeight, tx, _b, _c, txHash;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                console.log("unstaking ".concat(lpAmount, " Nazare ").concat(mint));
                program = NazareProgram(connection, anchor_1.Wallet);
                return [4 /*yield*/, getNazareVaultData(program, mint)];
            case 1:
                vaultData = _d.sent();
                vaultId = {
                    whirlpool: vaultData.account.whirlpoolId,
                    id: new anchor_1.BN(vaultData.account.id),
                };
                ggClient = new ggoldca_sdk_1.GGoldcaSDK({
                    programId: program.programId,
                    provider: program.provider,
                    connection: program.provider.connection,
                });
                return [4 /*yield*/, (0, spl_token_v2_1.getAssociatedTokenAddress)(vaultData.account.inputTokenAMintPubkey, payer.publicKey)];
            case 2:
                userTokenAAccount = _d.sent();
                return [4 /*yield*/, (0, spl_token_v2_1.getAssociatedTokenAddress)(vaultData.account.inputTokenBMintPubkey, payer.publicKey)];
            case 3:
                userTokenBAccount = _d.sent();
                return [4 /*yield*/, program.provider.connection.getAccountInfo(userTokenAAccount)];
            case 4:
                userTokenAAccountData = _d.sent();
                return [4 /*yield*/, program.provider.connection.getAccountInfo(userTokenBAccount)];
            case 5:
                userTokenBAccountData = _d.sent();
                return [4 /*yield*/, program.provider.connection.getLatestBlockhash()];
            case 6:
                _a = _d.sent(), blockhash = _a.blockhash, lastValidBlockHeight = _a.lastValidBlockHeight;
                tx = new web3_js_1.Transaction({
                    feePayer: payer.publicKey,
                    blockhash: blockhash,
                    lastValidBlockHeight: lastValidBlockHeight,
                });
                // Create the associated token accounts if it doesn't exist
                if (!userTokenAAccountData) {
                    tx.add((0, spl_token_v2_1.createAssociatedTokenAccountInstruction)(payer.publicKey, userTokenAAccount, payer.publicKey, vaultData.account.inputTokenAMintPubkey));
                }
                if (!userTokenBAccountData) {
                    tx.add((0, spl_token_v2_1.createAssociatedTokenAccountInstruction)(payer.publicKey, userTokenBAccount, payer.publicKey, vaultData.account.inputTokenBMintPubkey));
                }
                _c = (_b = tx).add;
                return [4 /*yield*/, ggClient.withdrawIx({
                        lpAmount: new anchor_1.BN(lpAmount),
                        minAmountA: new anchor_1.BN(0),
                        minAmountB: new anchor_1.BN(0),
                        userSigner: payer.publicKey,
                        vaultId: vaultId,
                    })];
            case 7:
                _c.apply(_b, [_d.sent()]);
                tx.sign(payer);
                return [4 /*yield*/, connection.sendRawTransaction(tx.serialize(), { skipPreflight: false })];
            case 8:
                txHash = _d.sent();
                return [4 /*yield*/, connection.confirmTransaction(txHash, 'confirmed')];
            case 9:
                _d.sent();
                console.log("successfully unstaked ".concat(lpAmount, " Nazare ").concat(mint, ": ").concat(txHash));
                return [2 /*return*/];
        }
    });
}); };
exports.unwrapNazareLp = unwrapNazareLp;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW53cmFwTmF6YXJlTHAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGlicy91bndyYXAvbmF6YXJlL3Vud3JhcE5hemFyZUxwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHlDQUF5QztBQUN6QywyQ0FFeUI7QUFDekIsMkNBQWtEO0FBQ2xELG9FQUF5RTtBQUN6RSxnREFBNEQ7QUFDNUQscURBRzhCO0FBQzlCLG9DQUE4QztBQUM5QyxxQ0FBeUM7QUFFNUIsUUFBQSxpQkFBaUIsR0FBRyxJQUFJLG1CQUFTLENBQUMsNkNBQTZDLENBQUMsQ0FBQztBQUU5RixTQUFTLGFBQWEsQ0FBQyxVQUFzQixFQUFFLE1BQWM7SUFDM0QsSUFBTSxRQUFRLEdBQUcsSUFBSSx5QkFBYyxDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUU7UUFDdEQsYUFBYSxFQUFFLEtBQUs7UUFDcEIsVUFBVSxFQUFFLFdBQVc7UUFDdkIsbUJBQW1CLEVBQUUsV0FBVztLQUNqQyxDQUFDLENBQUM7SUFDSCxPQUFPLElBQUksZ0JBQU8sQ0FBVSxhQUFHLEVBQUUseUJBQWlCLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDaEUsQ0FBQztBQUVELFNBQWUsa0JBQWtCLENBQUMsT0FBeUIsRUFBRSxJQUFlOzs7Ozt3QkFDeEQscUJBQU0sT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLEVBQUE7O29CQUFwRCxTQUFTLEdBQUcsU0FBd0M7b0JBRTFELFNBQVMsQ0FBQyxPQUFPLENBQUMsVUFBQyxTQUFTO3dCQUNwQixJQUFBLEtBQUEsT0FBb0MsbUJBQVMsQ0FBQyxzQkFBc0IsQ0FDeEUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENB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