"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiterLayout = exports.RATE_LIMITER_LEN = void 0;
const Layout = __importStar(require("../layout"));
const BufferLayout = require("buffer-layout");
exports.RATE_LIMITER_LEN = 56;
exports.RateLimiterLayout = BufferLayout.struct([
    BufferLayout.struct([Layout.uint64("maxOutflow"), Layout.uint64("windowDuration")], "config"),
    Layout.uint128("previousQuantity"),
    Layout.uint64("windowStart"),
    Layout.uint128("currentQuantity"),
], "rateLimiter");
