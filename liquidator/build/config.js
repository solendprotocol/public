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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.network = exports.getMarkets = exports.LENDING_MARKET_LEN = exports.RESERVE_LEN = exports.OBLIGATION_LEN = void 0;
/* eslint-disable no-loop-func */
var got_1 = __importDefault(require("got"));
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.OBLIGATION_LEN = 1300;
exports.RESERVE_LEN = 619;
exports.LENDING_MARKET_LEN = 290;
var eligibleApps = ['production', 'devnet'];
function getApp() {
    var app = process.env.APP;
    if (!eligibleApps.includes(app)) {
        throw new Error("Unrecognized env app provided: ".concat(app, ". Must be production or devnet"));
    }
    return app;
}
function getMarketsUrl() {
    // Only fetch the targeted markets if specified. Otherwise we fetch all solend pools
    if (process.env.MARKET) {
        return "https://api.solend.fi/v1/markets/configs?ids=".concat(process.env.MARKET);
    }
    return "https://api.solend.fi/v1/markets/configs?scope=solend&deployment=".concat(getApp());
}
function getMarkets() {
    return __awaiter(this, void 0, void 0, function () {
        var attemptCount, backoffFactor, maxAttempt, marketUrl, resp, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    attemptCount = 0;
                    backoffFactor = 1;
                    maxAttempt = 10;
                    marketUrl = getMarketsUrl();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    if (!(attemptCount > 0)) return [3 /*break*/, 3];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, backoffFactor * 10); })];
                case 2:
                    _a.sent();
                    backoffFactor *= 2;
                    _a.label = 3;
                case 3:
                    attemptCount += 1;
                    return [4 /*yield*/, (0, got_1.default)(marketUrl, { json: true })];
                case 4:
                    resp = _a.sent();
                    data = resp.body;
                    return [2 /*return*/, data];
                case 5:
                    error_1 = _a.sent();
                    console.error('error fetching /v1/markets/configs ', error_1);
                    return [3 /*break*/, 6];
                case 6:
                    if (attemptCount < maxAttempt) return [3 /*break*/, 1];
                    _a.label = 7;
                case 7: throw new Error('failed to fetch /v1/markets/configs');
            }
        });
    });
}
exports.getMarkets = getMarkets;
exports.network = getApp();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpQ0FBaUM7QUFDakMsNENBQXNCO0FBRXRCLGtEQUE0QjtBQUU1QixnQkFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRUgsUUFBQSxjQUFjLEdBQUcsSUFBSSxDQUFDO0FBQ3RCLFFBQUEsV0FBVyxHQUFHLEdBQUcsQ0FBQztBQUNsQixRQUFBLGtCQUFrQixHQUFHLEdBQUcsQ0FBQztBQUN0QyxJQUFNLFlBQVksR0FBRyxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztBQUU5QyxTQUFTLE1BQU07SUFDYixJQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQztJQUM1QixJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFJLENBQUMsRUFBRTtRQUNoQyxNQUFNLElBQUksS0FBSyxDQUNiLHlDQUFrQyxHQUFHLG1DQUFnQyxDQUN0RSxDQUFDO0tBQ0g7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFFRCxTQUFTLGFBQWE7SUFDcEIsb0ZBQW9GO0lBQ3BGLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUU7UUFDdEIsT0FBTyx1REFBZ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUUsQ0FBQztLQUM3RTtJQUVELE9BQU8sMkVBQW9FLE1BQU0sRUFBRSxDQUFFLENBQUM7QUFDeEYsQ0FBQztBQUVELFNBQXNCLFVBQVU7Ozs7OztvQkFDMUIsWUFBWSxHQUFHLENBQUMsQ0FBQztvQkFDakIsYUFBYSxHQUFHLENBQUMsQ0FBQztvQkFDaEIsVUFBVSxHQUFHLEVBQUUsQ0FBQztvQkFDaEIsU0FBUyxHQUFHLGFBQWEsRUFBRSxDQUFDOzs7O3lCQUkxQixDQUFBLFlBQVksR0FBRyxDQUFDLENBQUEsRUFBaEIsd0JBQWdCO29CQUNsQixxQkFBTSxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sSUFBSyxPQUFBLFVBQVUsQ0FBQyxPQUFPLEVBQUUsYUFBYSxHQUFHLEVBQUUsQ0FBQyxFQUF2QyxDQUF1QyxDQUFDLEVBQUE7O29CQUF2RSxTQUF1RSxDQUFDO29CQUN4RSxhQUFhLElBQUksQ0FBQyxDQUFDOzs7b0JBRXJCLFlBQVksSUFBSSxDQUFDLENBQUM7b0JBQ0wscUJBQU0sSUFBQSxhQUFHLEVBQUMsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUE7O29CQUEzQyxJQUFJLEdBQUcsU0FBb0M7b0JBQzNDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBc0IsQ0FBQztvQkFDekMsc0JBQU8sSUFBSSxFQUFDOzs7b0JBRVosT0FBTyxDQUFDLEtBQUssQ0FBQyxxQ0FBcUMsRUFBRSxPQUFLLENBQUMsQ0FBQzs7O3dCQUV2RCxZQUFZLEdBQUcsVUFBVTs7d0JBRWxDLE1BQU0sSUFBSSxLQUFLLENBQUMscUNBQXFDLENBQUMsQ0FBQzs7OztDQUN4RDtBQXRCRCxnQ0FzQkM7QUFFWSxRQUFBLE9BQU8sR0FBRyxNQUFNLEVBQUUsQ0FBQyJ9