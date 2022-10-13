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
Object.defineProperty(exports, "__esModule", { value: true });
var web3_js_1 = require("@solana/web3.js");
var SLIPPAGE = 2;
var SWAP_TIMEOUT_SEC = 20;
function swap(connection, wallet, jupiter, fromTokenInfo, toTokenInfo, amount) {
    return __awaiter(this, void 0, void 0, function () {
        var inputMint, outputMint, routes, execute;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log({
                        fromToken: fromTokenInfo.symbol,
                        toToken: toTokenInfo.symbol,
                        amount: amount.toString(),
                    }, 'swapping tokens');
                    inputMint = new web3_js_1.PublicKey(fromTokenInfo.mintAddress);
                    outputMint = new web3_js_1.PublicKey(toTokenInfo.mintAddress);
                    return [4 /*yield*/, jupiter.computeRoutes({
                            inputMint: inputMint,
                            outputMint: outputMint,
                            inputAmount: amount,
                            slippage: SLIPPAGE, // The slippage in % terms
                        })];
                case 1:
                    routes = _a.sent();
                    return [4 /*yield*/, jupiter.exchange({
                            routeInfo: routes.routesInfos[0],
                        })];
                case 2:
                    execute = (_a.sent()).execute;
                    // Execute swap
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            // sometime jup hangs hence the timeout here.
                            var timedOut = false;
                            var timeoutHandle = setTimeout(function () {
                                timedOut = true;
                                console.error("Swap took longer than ".concat(SWAP_TIMEOUT_SEC, " seconds to complete."));
                                reject('Swap timed out');
                            }, SWAP_TIMEOUT_SEC * 1000);
                            execute().then(function (swapResult) {
                                if (!timedOut) {
                                    clearTimeout(timeoutHandle);
                                    console.log({
                                        tx: swapResult.txid,
                                        inputAddress: swapResult.inputAddress.toString(),
                                        outputAddress: swapResult.outputAddress.toString(),
                                        inputAmount: swapResult.inputAmount / fromTokenInfo.decimals,
                                        outputAmount: swapResult.outputAmount / toTokenInfo.decimals,
                                        inputToken: fromTokenInfo.symbol,
                                        outputToken: toTokenInfo.symbol,
                                    }, 'successfully swapped token');
                                    resolve(swapResult);
                                }
                            }).catch(function (swapError) {
                                if (!timedOut) {
                                    clearTimeout(timeoutHandle);
                                    console.error({
                                        err: swapError.error,
                                        tx: swapError.txid,
                                        fromToken: fromTokenInfo.symbol,
                                        toToken: toTokenInfo.symbol,
                                    }, 'error swapping');
                                    resolve(swapError);
                                }
                            });
                        })];
                case 3:
                    // Execute swap
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.default = swap;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3dhcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWJzL3N3YXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSwyQ0FFeUI7QUFFekIsSUFBTSxRQUFRLEdBQUcsQ0FBQyxDQUFDO0FBQ25CLElBQU0sZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO0FBRTVCLFNBQThCLElBQUksQ0FBQyxVQUFzQixFQUFFLE1BQWUsRUFBRSxPQUFnQixFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsTUFBYzs7Ozs7O29CQUN0SSxPQUFPLENBQUMsR0FBRyxDQUFDO3dCQUNWLFNBQVMsRUFBRSxhQUFhLENBQUMsTUFBTTt3QkFDL0IsT0FBTyxFQUFFLFdBQVcsQ0FBQyxNQUFNO3dCQUMzQixNQUFNLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRTtxQkFDMUIsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO29CQUVoQixTQUFTLEdBQUcsSUFBSSxtQkFBUyxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDckQsVUFBVSxHQUFHLElBQUksbUJBQVMsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQzNDLHFCQUFNLE9BQU8sQ0FBQyxhQUFhLENBQUM7NEJBQ3pDLFNBQVMsV0FBQTs0QkFDVCxVQUFVLFlBQUE7NEJBQ1YsV0FBVyxFQUFFLE1BQU07NEJBQ25CLFFBQVEsRUFBRSxRQUFRLEVBQUUsMEJBQTBCO3lCQUMvQyxDQUFDLEVBQUE7O29CQUxJLE1BQU0sR0FBRyxTQUtiO29CQUdrQixxQkFBTSxPQUFPLENBQUMsUUFBUSxDQUFDOzRCQUN6QyxTQUFTLEVBQUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7eUJBQ2pDLENBQUMsRUFBQTs7b0JBRk0sT0FBTyxHQUFLLENBQUEsU0FFbEIsQ0FBQSxRQUZhO29CQUlmLGVBQWU7b0JBQ2YscUJBQU0sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTs0QkFDaEMsNkNBQTZDOzRCQUM3QyxJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUM7NEJBQ3JCLElBQU0sYUFBYSxHQUFHLFVBQVUsQ0FBQztnQ0FDL0IsUUFBUSxHQUFHLElBQUksQ0FBQztnQ0FDaEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQ0FBeUIsZ0JBQWdCLDBCQUF1QixDQUFDLENBQUM7Z0NBQ2hGLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDOzRCQUMzQixDQUFDLEVBQUUsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLENBQUM7NEJBRTVCLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFDLFVBQWU7Z0NBQzdCLElBQUksQ0FBQyxRQUFRLEVBQUU7b0NBQ2IsWUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFDO29DQUU1QixPQUFPLENBQUMsR0FBRyxDQUFDO3dDQUNWLEVBQUUsRUFBRSxVQUFVLENBQUMsSUFBSTt3Q0FDbkIsWUFBWSxFQUFFLFVBQVUsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFO3dDQUNoRCxhQUFhLEVBQUUsVUFBVSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUU7d0NBQ2xELFdBQVcsRUFBRSxVQUFVLENBQUMsV0FBVyxHQUFHLGFBQWEsQ0FBQyxRQUFRO3dDQUM1RCxZQUFZLEVBQUUsVUFBVSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUMsUUFBUTt3Q0FDNUQsVUFBVSxFQUFFLGFBQWEsQ0FBQyxNQUFNO3dDQUNoQyxXQUFXLEVBQUUsV0FBVyxDQUFDLE1BQU07cUNBQ2hDLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztvQ0FDakMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2lDQUNyQjs0QkFDSCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBQyxTQUFTO2dDQUNqQixJQUFJLENBQUMsUUFBUSxFQUFFO29DQUNiLFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQztvQ0FDNUIsT0FBTyxDQUFDLEtBQUssQ0FBQzt3Q0FDWixHQUFHLEVBQUUsU0FBUyxDQUFDLEtBQUs7d0NBQ3BCLEVBQUUsRUFBRSxTQUFTLENBQUMsSUFBSTt3Q0FDbEIsU0FBUyxFQUFFLGFBQWEsQ0FBQyxNQUFNO3dDQUMvQixPQUFPLEVBQUUsV0FBVyxDQUFDLE1BQU07cUNBQzVCLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztvQ0FDckIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2lDQUNwQjs0QkFDSCxDQUFDLENBQUMsQ0FBQzt3QkFDTCxDQUFDLENBQUMsRUFBQTs7b0JBckNGLGVBQWU7b0JBQ2YsU0FvQ0UsQ0FBQzs7Ozs7Q0FDSjtBQTNERCx1QkEyREMifQ==