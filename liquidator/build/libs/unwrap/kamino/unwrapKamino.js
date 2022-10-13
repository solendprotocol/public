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
exports.checkAndUnwrapKaminoTokens = void 0;
/* eslint-disable no-restricted-syntax,no-continue */
var web3_js_1 = require("@solana/web3.js");
var kamino_sdk_1 = require("@hubbleprotocol/kamino-sdk");
var hubble_config_1 = require("@hubbleprotocol/hubble-config");
var cluster = process.env.APP === 'production' ? 'mainnet-beta' : 'devnet';
var checkAndUnwrapKaminoTokens = function (connection, payer) { return __awaiter(void 0, void 0, void 0, function () {
    var kamino, config, _a, _b, strategyPubkey, strategy, strategyWithAddress, withdrawInstruction, _c, sharesAta, sharesMintData, _d, tokenAAta, tokenAData, _e, tokenBAta, tokenBData, tx, ataInstructions, txHash, e_1_1;
    var e_1, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                kamino = new kamino_sdk_1.Kamino(cluster, connection);
                config = (0, hubble_config_1.getConfigByCluster)(cluster);
                _g.label = 1;
            case 1:
                _g.trys.push([1, 13, 14, 15]);
                _a = __values(config.kamino.strategies), _b = _a.next();
                _g.label = 2;
            case 2:
                if (!!_b.done) return [3 /*break*/, 12];
                strategyPubkey = _b.value;
                return [4 /*yield*/, kamino.getStrategyByAddress(strategyPubkey)];
            case 3:
                strategy = _g.sent();
                if (!strategy) {
                    console.error('Could not fetch strategy from the chain');
                    return [3 /*break*/, 11];
                }
                strategyWithAddress = { strategy: strategy, address: strategyPubkey };
                return [4 /*yield*/, kamino.withdrawAllShares(strategyWithAddress, payer.publicKey)];
            case 4:
                withdrawInstruction = _g.sent();
                if (!withdrawInstruction) return [3 /*break*/, 11];
                return [4 /*yield*/, (0, kamino_sdk_1.getAssociatedTokenAddressAndData)(connection, strategy.sharesMint, payer.publicKey)];
            case 5:
                _c = __read.apply(void 0, [_g.sent(), 2]), sharesAta = _c[0], sharesMintData = _c[1];
                return [4 /*yield*/, (0, kamino_sdk_1.getAssociatedTokenAddressAndData)(connection, strategy.tokenAMint, payer.publicKey)];
            case 6:
                _d = __read.apply(void 0, [_g.sent(), 2]), tokenAAta = _d[0], tokenAData = _d[1];
                return [4 /*yield*/, (0, kamino_sdk_1.getAssociatedTokenAddressAndData)(connection, strategy.tokenBMint, payer.publicKey)];
            case 7:
                _e = __read.apply(void 0, [_g.sent(), 2]), tokenBAta = _e[0], tokenBData = _e[1];
                tx = (0, kamino_sdk_1.createTransactionWithExtraBudget)(payer.publicKey);
                return [4 /*yield*/, kamino.getCreateAssociatedTokenAccountInstructionsIfNotExist(payer.publicKey, strategyWithAddress, tokenAData, tokenAAta, tokenBData, tokenBAta, sharesMintData, sharesAta)];
            case 8:
                ataInstructions = _g.sent();
                if (ataInstructions.length > 0) {
                    tx.add.apply(tx, __spreadArray([], __read(ataInstructions), false));
                }
                tx.add(withdrawInstruction);
                return [4 /*yield*/, (0, kamino_sdk_1.assignBlockInfoToTransaction)(connection, tx, payer.publicKey)];
            case 9:
                tx = _g.sent();
                return [4 /*yield*/, (0, web3_js_1.sendAndConfirmTransaction)(connection, tx, [payer], {
                        commitment: 'confirmed',
                    })];
            case 10:
                txHash = _g.sent();
                console.log("successfully withdrew Kamino shares from strategy (".concat(strategyPubkey.toString(), "): ").concat(txHash));
                _g.label = 11;
            case 11:
                _b = _a.next();
                return [3 /*break*/, 2];
            case 12: return [3 /*break*/, 15];
            case 13:
                e_1_1 = _g.sent();
                e_1 = { error: e_1_1 };
                return [3 /*break*/, 15];
            case 14:
                try {
                    if (_b && !_b.done && (_f = _a.return)) _f.call(_a);
                }
                finally { if (e_1) throw e_1.error; }
                return [7 /*endfinally*/];
            case 15: return [2 /*return*/];
        }
    });
}); };
exports.checkAndUnwrapKaminoTokens = checkAndUnwrapKaminoTokens;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW53cmFwS2FtaW5vLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYnMvdW53cmFwL2thbWluby91bndyYXBLYW1pbm8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEscURBQXFEO0FBQ3JELDJDQUFpRjtBQUNqRix5REFFb0M7QUFDcEMsK0RBQW1FO0FBRW5FLElBQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLFlBQVksQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7QUFFdEUsSUFBTSwwQkFBMEIsR0FBRyxVQUN4QyxVQUFzQixFQUN0QixLQUFjOzs7Ozs7Z0JBRVIsTUFBTSxHQUFHLElBQUksbUJBQU0sQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ3pDLE1BQU0sR0FBRyxJQUFBLGtDQUFrQixFQUFDLE9BQU8sQ0FBQyxDQUFDOzs7O2dCQUNkLEtBQUEsU0FBQSxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQTs7OztnQkFBMUMsY0FBYztnQkFDTixxQkFBTSxNQUFNLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLEVBQUE7O2dCQUE1RCxRQUFRLEdBQUcsU0FBaUQ7Z0JBQ2xFLElBQUksQ0FBQyxRQUFRLEVBQUU7b0JBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO29CQUN6RCx5QkFBUztpQkFDVjtnQkFDSyxtQkFBbUIsR0FBRyxFQUFFLFFBQVEsVUFBQSxFQUFFLE9BQU8sRUFBRSxjQUFjLEVBQUUsQ0FBQztnQkFFdEMscUJBQU0sTUFBTSxDQUFDLGlCQUFpQixDQUFDLG1CQUFtQixFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBQTs7Z0JBQTFGLG1CQUFtQixHQUFHLFNBQW9FO3FCQUU1RixtQkFBbUIsRUFBbkIseUJBQW1CO2dCQUNlLHFCQUFNLElBQUEsNkNBQWdDLEVBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFBOztnQkFBdEgsS0FBQSxzQkFBOEIsU0FBd0YsS0FBQSxFQUFySCxTQUFTLFFBQUEsRUFBRSxjQUFjLFFBQUE7Z0JBQ0EscUJBQU0sSUFBQSw2Q0FBZ0MsRUFBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUE7O2dCQUFsSCxLQUFBLHNCQUEwQixTQUF3RixLQUFBLEVBQWpILFNBQVMsUUFBQSxFQUFFLFVBQVUsUUFBQTtnQkFDSSxxQkFBTSxJQUFBLDZDQUFnQyxFQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBQTs7Z0JBQWxILEtBQUEsc0JBQTBCLFNBQXdGLEtBQUEsRUFBakgsU0FBUyxRQUFBLEVBQUUsVUFBVSxRQUFBO2dCQUd4QixFQUFFLEdBQUcsSUFBQSw2Q0FBZ0MsRUFBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBRW5DLHFCQUFNLE1BQU0sQ0FBQyxxREFBcUQsQ0FDeEYsS0FBSyxDQUFDLFNBQVMsRUFDZixtQkFBbUIsRUFDbkIsVUFBVSxFQUNWLFNBQVMsRUFDVCxVQUFVLEVBQ1YsU0FBUyxFQUNULGNBQWMsRUFDZCxTQUFTLENBQ1YsRUFBQTs7Z0JBVEssZUFBZSxHQUFHLFNBU3ZCO2dCQUNELElBQUksZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7b0JBQzlCLEVBQUUsQ0FBQyxHQUFHLE9BQU4sRUFBRSwyQkFBUSxlQUFlLFdBQUU7aUJBQzVCO2dCQUVELEVBQUUsQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQztnQkFFdkIscUJBQU0sSUFBQSx5Q0FBNEIsRUFBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBQTs7Z0JBQXhFLEVBQUUsR0FBRyxTQUFtRSxDQUFDO2dCQUUxRCxxQkFBTSxJQUFBLG1DQUF5QixFQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRTt3QkFDdEUsVUFBVSxFQUFFLFdBQVc7cUJBQ3hCLENBQUMsRUFBQTs7Z0JBRkksTUFBTSxHQUFHLFNBRWI7Z0JBRUYsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2REFBc0QsY0FBYyxDQUFDLFFBQVEsRUFBRSxnQkFBTSxNQUFNLENBQUUsQ0FBQyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tBR2hILENBQUM7QUFqRFcsUUFBQSwwQkFBMEIsOEJBaURyQyJ9