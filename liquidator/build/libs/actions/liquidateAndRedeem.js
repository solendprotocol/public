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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.liquidateAndRedeem = void 0;
var spl_token_1 = require("@solana/spl-token");
var web3_js_1 = require("@solana/web3.js");
var utils_1 = require("libs/utils");
var underscore_1 = require("underscore");
var refreshReserve_1 = require("models/instructions/refreshReserve");
var LiquidateObligationAndRedeemReserveCollateral_1 = require("models/instructions/LiquidateObligationAndRedeemReserveCollateral");
var refreshObligation_1 = require("models/instructions/refreshObligation");
var liquidateAndRedeem = function (connection, payer, liquidityAmount, repayTokenSymbol, withdrawTokenSymbol, lendingMarket, obligation) { return __awaiter(void 0, void 0, void 0, function () {
    var ixs, depositReserves, borrowReserves, uniqReserveAddresses, refreshObligationIx, repayTokenInfo, repayAccount, reserveSymbolToReserveMap, repayReserve, withdrawReserve, withdrawTokenInfo, rewardedWithdrawalCollateralAccount, rewardedWithdrawalCollateralAccountInfo, createUserCollateralAccountIx, rewardedWithdrawalLiquidityAccount, rewardedWithdrawalLiquidityAccountInfo, createUserCollateralAccountIx, tx, blockhash, txHash;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                ixs = [];
                depositReserves = (0, underscore_1.map)(obligation.info.deposits, function (deposit) { return deposit.depositReserve; });
                borrowReserves = (0, underscore_1.map)(obligation.info.borrows, function (borrow) { return borrow.borrowReserve; });
                uniqReserveAddresses = __spreadArray([], __read(new Set((0, underscore_1.map)(depositReserves.concat(borrowReserves), function (reserve) { return reserve.toString(); }))), false);
                uniqReserveAddresses.forEach(function (reserveAddress) {
                    var reserveInfo = (0, underscore_1.findWhere)(lendingMarket.reserves, {
                        address: reserveAddress,
                    });
                    var refreshReserveIx = (0, refreshReserve_1.refreshReserveInstruction)(new web3_js_1.PublicKey(reserveAddress), new web3_js_1.PublicKey(reserveInfo.pythOracle), new web3_js_1.PublicKey(reserveInfo.switchboardOracle));
                    ixs.push(refreshReserveIx);
                });
                refreshObligationIx = (0, refreshObligation_1.refreshObligationInstruction)(obligation.pubkey, depositReserves, borrowReserves);
                ixs.push(refreshObligationIx);
                repayTokenInfo = (0, utils_1.getTokenInfoFromMarket)(lendingMarket, repayTokenSymbol);
                return [4 /*yield*/, spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey(repayTokenInfo.mintAddress), payer.publicKey)];
            case 1:
                repayAccount = _b.sent();
                reserveSymbolToReserveMap = new Map(lendingMarket.reserves.map(function (reserve) { return [reserve.liquidityToken.symbol, reserve]; }));
                repayReserve = reserveSymbolToReserveMap.get(repayTokenSymbol);
                withdrawReserve = reserveSymbolToReserveMap.get(withdrawTokenSymbol);
                withdrawTokenInfo = (0, utils_1.getTokenInfoFromMarket)(lendingMarket, withdrawTokenSymbol);
                if (!withdrawReserve || !repayReserve) {
                    throw new Error('reserves are not identified');
                }
                return [4 /*yield*/, spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey(withdrawReserve.collateralMintAddress), payer.publicKey)];
            case 2:
                rewardedWithdrawalCollateralAccount = _b.sent();
                return [4 /*yield*/, connection.getAccountInfo(rewardedWithdrawalCollateralAccount)];
            case 3:
                rewardedWithdrawalCollateralAccountInfo = _b.sent();
                if (!rewardedWithdrawalCollateralAccountInfo) {
                    createUserCollateralAccountIx = spl_token_1.Token.createAssociatedTokenAccountInstruction(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey(withdrawReserve.collateralMintAddress), rewardedWithdrawalCollateralAccount, payer.publicKey, payer.publicKey);
                    ixs.push(createUserCollateralAccountIx);
                }
                return [4 /*yield*/, spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey(withdrawTokenInfo.mintAddress), payer.publicKey)];
            case 4:
                rewardedWithdrawalLiquidityAccount = _b.sent();
                return [4 /*yield*/, connection.getAccountInfo(rewardedWithdrawalLiquidityAccount)];
            case 5:
                rewardedWithdrawalLiquidityAccountInfo = _b.sent();
                if (!rewardedWithdrawalLiquidityAccountInfo) {
                    createUserCollateralAccountIx = spl_token_1.Token.createAssociatedTokenAccountInstruction(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey(withdrawTokenInfo.mintAddress), rewardedWithdrawalLiquidityAccount, payer.publicKey, payer.publicKey);
                    ixs.push(createUserCollateralAccountIx);
                }
                ixs.push((0, LiquidateObligationAndRedeemReserveCollateral_1.LiquidateObligationAndRedeemReserveCollateral)(liquidityAmount, repayAccount, rewardedWithdrawalCollateralAccount, rewardedWithdrawalLiquidityAccount, new web3_js_1.PublicKey(repayReserve.address), new web3_js_1.PublicKey(repayReserve.liquidityAddress), new web3_js_1.PublicKey(withdrawReserve.address), new web3_js_1.PublicKey(withdrawReserve.collateralMintAddress), new web3_js_1.PublicKey(withdrawReserve.collateralSupplyAddress), new web3_js_1.PublicKey(withdrawReserve.liquidityAddress), new web3_js_1.PublicKey(withdrawReserve.liquidityFeeReceiverAddress), obligation.pubkey, new web3_js_1.PublicKey(lendingMarket.address), new web3_js_1.PublicKey(lendingMarket.authorityAddress), payer.publicKey));
                tx = (_a = new web3_js_1.Transaction()).add.apply(_a, __spreadArray([], __read(ixs), false));
                return [4 /*yield*/, connection.getRecentBlockhash()];
            case 6:
                blockhash = (_b.sent()).blockhash;
                tx.recentBlockhash = blockhash;
                tx.feePayer = payer.publicKey;
                tx.sign(payer);
                return [4 /*yield*/, connection.sendRawTransaction(tx.serialize(), { skipPreflight: false })];
            case 7:
                txHash = _b.sent();
                return [4 /*yield*/, connection.confirmTransaction(txHash, 'processed')];
            case 8:
                _b.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.liquidateAndRedeem = liquidateAndRedeem;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlxdWlkYXRlQW5kUmVkZWVtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYnMvYWN0aW9ucy9saXF1aWRhdGVBbmRSZWRlZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtDQUUyQjtBQUMzQiwyQ0FNeUI7QUFDekIsb0NBRW9CO0FBQ3BCLHlDQUE0QztBQUM1QyxxRUFBK0U7QUFDL0UsbUlBQWtJO0FBQ2xJLDJFQUFxRjtBQUc5RSxJQUFNLGtCQUFrQixHQUFHLFVBQ2hDLFVBQXNCLEVBQ3RCLEtBQWMsRUFDZCxlQUFnQyxFQUNoQyxnQkFBd0IsRUFDeEIsbUJBQTJCLEVBQzNCLGFBQTJCLEVBQzNCLFVBQWU7Ozs7OztnQkFFVCxHQUFHLEdBQTZCLEVBQUUsQ0FBQztnQkFFbkMsZUFBZSxHQUFHLElBQUEsZ0JBQUcsRUFBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxVQUFDLE9BQU8sSUFBSyxPQUFBLE9BQU8sQ0FBQyxjQUFjLEVBQXRCLENBQXNCLENBQUMsQ0FBQztnQkFDckYsY0FBYyxHQUFHLElBQUEsZ0JBQUcsRUFBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxVQUFDLE1BQU0sSUFBSyxPQUFBLE1BQU0sQ0FBQyxhQUFhLEVBQXBCLENBQW9CLENBQUMsQ0FBQztnQkFDaEYsb0JBQW9CLDRCQUFPLElBQUksR0FBRyxDQUFTLElBQUEsZ0JBQUcsRUFBQyxlQUFlLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFLFVBQUMsT0FBTyxJQUFLLE9BQUEsT0FBTyxDQUFDLFFBQVEsRUFBRSxFQUFsQixDQUFrQixDQUFDLENBQUMsU0FBQyxDQUFDO2dCQUNoSSxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsVUFBQyxjQUFjO29CQUMxQyxJQUFNLFdBQVcsR0FBd0IsSUFB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