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
exports.getTokensOracleData = void 0;
var client_1 = require("@pythnetwork/client");
var switchboard_api_1 = require("@switchboard-xyz/switchboard-api");
var sbv2_lite_1 = __importDefault(require("@switchboard-xyz/sbv2-lite"));
var web3_js_1 = require("@solana/web3.js");
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var NULL_ORACLE = 'nu11111111111111111111111111111111111111111';
var SWITCHBOARD_V1_ADDRESS = 'DtmE9D2CSB4L5D6A15mraeEjrGMm6auWVzgaD8hK2tZM';
var SWITCHBOARD_V2_ADDRESS = 'SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f';
var switchboardV2;
function getTokenOracleData(connection, reserve) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var price, oracle, pricePublicKey, result, pricePublicKey, info, owner, result, result;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    oracle = {
                        priceAddress: reserve.pythOracle,
                        switchboardFeedAddress: reserve.switchboardOracle,
                    };
                    if (!(oracle.priceAddress && oracle.priceAddress !== NULL_ORACLE)) return [3 /*break*/, 2];
                    pricePublicKey = new web3_js_1.PublicKey(oracle.priceAddress);
                    return [4 /*yield*/, connection.getAccountInfo(pricePublicKey)];
                case 1:
                    result = _c.sent();
                    price = (0, client_1.parsePriceData)(result.data).price;
                    return [3 /*break*/, 8];
                case 2:
                    pricePublicKey = new web3_js_1.PublicKey(oracle.switchboardFeedAddress);
                    return [4 /*yield*/, connection.getAccountInfo(pricePublicKey)];
                case 3:
                    info = _c.sent();
                    owner = info === null || info === void 0 ? void 0 : info.owner.toString();
                    if (!(owner === SWITCHBOARD_V1_ADDRESS)) return [3 /*break*/, 4];
                    result = switchboard_api_1.AggregatorState.decodeDelimited((_a = info === null || info === void 0 ? void 0 : info.data) === null || _a === void 0 ? void 0 : _a.slice(1));
                    price = (_b = result === null || result === void 0 ? void 0 : result.lastRoundResult) === null || _b === void 0 ? void 0 : _b.result;
                    return [3 /*break*/, 8];
                case 4:
                    if (!(owner === SWITCHBOARD_V2_ADDRESS)) return [3 /*break*/, 7];
                    if (!!switchboardV2) return [3 /*break*/, 6];
                    return [4 /*yield*/, sbv2_lite_1.default.loadMainnet(connection)];
                case 5:
                    switchboardV2 = _c.sent();
                    _c.label = 6;
                case 6:
                    result = switchboardV2.decodeLatestAggregatorValue(info);
                    price = result === null || result === void 0 ? void 0 : result.toNumber();
                    return [3 /*break*/, 8];
                case 7:
                    console.error('unrecognized switchboard owner address: ', owner);
                    _c.label = 8;
                case 8: return [2 /*return*/, {
                        symbol: reserve.liquidityToken.symbol,
                        reserveAddress: reserve.address,
                        mintAddress: reserve.liquidityToken.mint,
                        decimals: new bignumber_js_1.default(Math.pow(10, reserve.liquidityToken.decimals)),
                        price: new bignumber_js_1.default(price),
                    }];
            }
        });
    });
}
function getTokensOracleData(connection, market) {
    return __awaiter(this, void 0, void 0, function () {
        var promises;
        return __generator(this, function (_a) {
            promises = market.reserves.map(function (reserve) { return getTokenOracleData(connection, reserve); });
            return [2 /*return*/, Promise.all(promises)];
        });
    });
}
exports.getTokensOracleData = getTokensOracleData;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHl0aC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWJzL3B5dGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsOENBQXFEO0FBQ3JELG9FQUUwQztBQUMxQyx5RUFBNEQ7QUFDNUQsMkNBQXdEO0FBQ3hELDhEQUFxQztBQUdyQyxJQUFNLFdBQVcsR0FBRyw2Q0FBNkMsQ0FBQztBQUNsRSxJQUFNLHNCQUFzQixHQUFHLDhDQUE4QyxDQUFDO0FBQzlFLElBQU0sc0JBQXNCLEdBQUcsNkNBQTZDLENBQUM7QUFFN0UsSUFBSSxhQUE2QyxDQUFDO0FBVWxELFNBQWUsa0JBQWtCLENBQUMsVUFBc0IsRUFBRSxPQUE0Qjs7Ozs7OztvQkFFOUUsTUFBTSxHQUFHO3dCQUNiLFlBQVksRUFBRSxPQUFPLENBQUMsVUFBVTt3QkFDaEMsc0JBQXNCLEVBQUUsT0FBTyxDQUFDLGlCQUFpQjtxQkFDbEQsQ0FBQzt5QkFFRSxDQUFBLE1BQU0sQ0FBQyxZQUFZLElBQUksTUFBTSxDQUFDLFlBQVksS0FBSyxXQUFXLENBQUEsRUFBMUQsd0JBQTBEO29CQUN0RCxjQUFjLEdBQUcsSUFBSSxtQkFBUyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztvQkFDM0MscUJBQU0sVUFBVSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsRUFBQTs7b0JBQXhELE1BQU0sR0FBRyxTQUErQztvQkFDOUQsS0FBSyxHQUFHLElBQUEsdUJBQWMsRUFBQyxNQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDOzs7b0JBRXJDLGNBQWMsR0FBRyxJQUFJLG1CQUFTLENBQUMsTUFBTSxDQUFDLHNCQUFzQixDQUFDLENBQUM7b0JBQ3ZELHFCQUFNLFVBQVUsQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLEVBQUE7O29CQUF0RCxJQUFJLEdBQUcsU0FBK0M7b0JBQ3RELEtBQUssR0FBRyxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO3lCQUNqQyxDQUFBLEtBQUssS0FBSyxzQkFBc0IsQ0FBQSxFQUFoQyx3QkFBZ0M7b0JBQzVCLE1BQU0sR0FBRyxpQ0FBZSxDQUFDLGVBQWUsQ0FBQyxNQUFDLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxJQUFlLDBDQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNqRixLQUFLLEdBQUcsTUFBQSxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsZUFBZSwwQ0FBRSxNQUFNLENBQUM7Ozt5QkFDL0IsQ0FBQSxLQUFLLEtBQUssc0JBQXNCLENBQUEsRUFBaEMsd0JBQWdDO3lCQUNyQyxDQUFDLGFBQWEsRUFBZCx3QkFBYztvQkFDQSxxQkFBTSxtQkFBa0IsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLEVBQUE7O29CQUFoRSxhQUFhLEdBQUcsU0FBZ0QsQ0FBQzs7O29CQUU3RCxNQUFNLEdBQUcsYUFBYSxDQUFDLDJCQUEyQixDQUFDLElBQUssQ0FBQyxDQUFDO29CQUNoRSxLQUFLLEdBQUcsTUFBTSxhQUFOLE1BQU0sdUJBQU4sTUFBTSxDQUFFLFFBQVEsRUFBRSxDQUFDOzs7b0JBRTNCLE9BQU8sQ0FBQyxLQUFLLENBQUMsMENBQTBDLEVBQUUsS0FBSyxDQUFDLENBQUM7O3dCQUlyRSxzQkFBTzt3QkFDTCxNQUFNLEVBQUUsT0FBTyxDQUFDLGNBQWMsQ0FBQyxNQUFNO3dCQUNyQyxjQUFjLEVBQUUsT0FBTyxDQUFDLE9BQU87d0JBQy9CLFdBQVcsRUFBRSxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUk7d0JBQ3hDLFFBQVEsRUFBRSxJQUFJLHNCQUFTLENBQUMsU0FBQSxFQUFFLEVBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUEsQ0FBQzt3QkFDOUQsS0FBSyxFQUFFLElBQUksc0JBQVMsQ0FBQyxLQUFNLENBQUM7cUJBQ1YsRUFBQzs7OztDQUN0QjtBQUVELFNBQXNCLG1CQUFtQixDQUFDLFVBQXNCLEVBQUUsTUFBb0I7Ozs7WUFDOUUsUUFBUSxHQUFtQixNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFDLE9BQU8sSUFBSyxPQUFBLGtCQUFrQixDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsRUFBdkMsQ0FBdUMsQ0FBQyxDQUFDO1lBQzNHLHNCQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUM7OztDQUM5QjtBQUhELGtEQUdDIn0=