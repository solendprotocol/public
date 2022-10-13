"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rustString = exports.uint128 = exports.uint64 = exports.publicKey = void 0;
var web3_js_1 = require("@solana/web3.js");
var bn_js_1 = __importDefault(require("bn.js"));
var BufferLayout = __importStar(require("buffer-layout"));
/**
 * Layout for a public key
 */
var publicKey = function (property) {
    if (property === void 0) { property = 'publicKey'; }
    var publicKeyLayout = BufferLayout.blob(32, property);
    var _decode = publicKeyLayout.decode.bind(publicKeyLayout);
    var _encode = publicKeyLayout.encode.bind(publicKeyLayout);
    publicKeyLayout.decode = function (buffer, offset) {
        var data = _decode(buffer, offset);
        return new web3_js_1.PublicKey(data);
    };
    publicKeyLayout.encode = function (key, buffer, offset) {
        _encode(key.toBuffer(), buffer, offset);
    };
    return publicKeyLayout;
};
exports.publicKey = publicKey;
/**
 * Layout for a 64bit unsigned value
 */
var uint64 = function (property) {
    if (property === void 0) { property = 'uint64'; }
    var layout = BufferLayout.blob(8, property);
    var _decode = layout.decode.bind(layout);
    var _encode = layout.encode.bind(layout);
    layout.decode = function (buffer, offset) {
        var data = _decode(buffer, offset);
        return new bn_js_1.default(__spreadArray([], __read(data), false).reverse()
            .map(function (i) { return "00".concat(i.toString(16)).slice(-2); })
            .join(''), 16);
    };
    layout.encode = function (num, buffer, offset) {
        var a = num.toArray().reverse();
        var b = Buffer.from(a);
        if (b.length !== 8) {
            var zeroPad = Buffer.alloc(8);
            b.copy(zeroPad);
            b = zeroPad;
        }
        return _encode(b, buffer, offset);
    };
    return layout;
};
exports.uint64 = uint64;
// TODO: wrap in BN (what about decimals?)
var uint128 = function (property) {
    if (property === void 0) { property = 'uint128'; }
    var layout = BufferLayout.blob(16, property);
    var _decode = layout.decode.bind(layout);
    var _encode = layout.encode.bind(layout);
    layout.decode = function (buffer, offset) {
        var data = _decode(buffer, offset);
        return new bn_js_1.default(__spreadArray([], __read(data), false).reverse()
            .map(function (i) { return "00".concat(i.toString(16)).slice(-2); })
            .join(''), 16);
    };
    layout.encode = function (num, buffer, offset) {
        var a = num.toArray().reverse();
        var b = Buffer.from(a);
        if (b.length !== 16) {
            var zeroPad = Buffer.alloc(16);
            b.copy(zeroPad);
            b = zeroPad;
        }
        return _encode(b, buffer, offset);
    };
    return layout;
};
exports.uint128 = uint128;
/**
 * Layout for a Rust String type
 */
var rustString = function (property) {
    if (property === void 0) { property = 'string'; }
    var rsl = BufferLayout.struct([
        BufferLayout.u32('length'),
        BufferLayout.u32('lengthPadding'),
        BufferLayout.blob(BufferLayout.offset(BufferLayout.u32(), -8), 'chars'),
    ], property);
    var _decode = rsl.decode.bind(rsl);
    var _encode = rsl.encode.bind(rsl);
    rsl.decode = function (buffer, offset) {
        var data = _decode(buffer, offset);
        return data.chars.toString('utf8');
    };
    rsl.encode = function (str, buffer, offset) {
        var data = {
            chars: Buffer.from(str, 'utf8'),
        };
        return _encode(data, buffer, offset);
    };
    return rsl;
};
exports.rustString = rustString;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF5b3V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpYnMvbGF5b3V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJDQUE0QztBQUM1QyxnREFBdUI7QUFDdkIsMERBQThDO0FBRTlDOztHQUVHO0FBQ0ksSUFBTSxTQUFTLEdBQUcsVUFBQyxRQUFzQjtJQUF0Qix5QkFBQSxFQUFBLHNCQUFzQjtJQUM5QyxJQUFNLGVBQWUsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUV4RCxJQUFNLE9BQU8sR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUM3RCxJQUFNLE9BQU8sR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUU3RCxlQUFlLENBQUMsTUFBTSxHQUFHLFVBQUMsTUFBYyxFQUFFLE1BQWM7UUFDdEQsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNyQyxPQUFPLElBQUksbUJBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM3QixDQUFDLENBQUM7SUFFRixlQUFlLENBQUMsTUFBTSxHQUFHLFVBQUMsR0FBYyxFQUFFLE1BQWMsRUFBRSxNQUFjO1FBQ3RFLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzFDLENBQUMsQ0FBQztJQUVGLE9BQU8sZUFBZSxDQUFDO0FBQ3pCLENBQUMsQ0FBQztBQWhCVyxRQUFBLFNBQVMsYUFnQnBCO0FBRUY7O0dBRUc7QUFDSSxJQUFNLE1BQU0sR0FBRyxVQUFDLFFBQW1CO0lBQW5CLHlCQUFBLEVBQUEsbUJBQW1CO0lBQ3hDLElBQU0s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