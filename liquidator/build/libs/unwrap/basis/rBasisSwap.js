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
exports.unstakeBasis = exports.checkAndUnwrapBasisTokens = void 0;
var spl_token_1 = require("@solana/spl-token");
var web3_js_1 = require("@solana/web3.js");
var utils_1 = require("libs/utils");
var unstake_1 = require("models/instructions/basis/unstake");
var checkAndUnwrapBasisTokens = function (connection, payer) { return __awaiter(void 0, void 0, void 0, function () {
    var rBasisPubKey, tokenAmount;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                rBasisPubKey = new web3_js_1.PublicKey(unstake_1.MINT_RBASIS);
                return [4 /*yield*/, (0, utils_1.getWalletBalance)(connection, rBasisPubKey, payer.publicKey)];
            case 1:
                tokenAmount = _a.sent();
                if (!tokenAmount) return [3 /*break*/, 3];
                return [4 /*yield*/, (0, exports.unstakeBasis)(connection, payer, rBasisPubKey, tokenAmount)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.checkAndUnwrapBasisTokens = checkAndUnwrapBasisTokens;
var unstakeBasis = function (connection, payer, mint, amount) { return __awaiter(void 0, void 0, void 0, function () {
    var ixs, rBasisAccount, BasisAccount, BasisAccountInfo, createBasisAtaIx, unstakeBasisIx, tx, blockhash, txHash;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log("unstaking ".concat(amount, " rBasis"));
                ixs = [];
                return [4 /*yield*/, spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey(mint), payer.publicKey)];
            case 1:
                rBasisAccount = _b.sent();
                return [4 /*yield*/, spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey(unstake_1.MINT_BASIS), payer.publicKey)];
            case 2:
                BasisAccount = _b.sent();
                return [4 /*yield*/, connection.getAccountInfo(BasisAccount)];
            case 3:
                BasisAccountInfo = _b.sent();
                if (!BasisAccountInfo) {
                    createBasisAtaIx = spl_token_1.Token.createAssociatedTokenAccountInstruction(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey(unstake_1.MINT_BASIS), BasisAccount, payer.publicKey, payer.publicKey);
                    ixs.push(createBasisAtaIx);
                }
                unstakeBasisIx = (0, unstake_1.unstakeBasisInstruction)(amount, // NOTE: full unstake
                payer.publicKey, BasisAccount, rBasisAccount);
                ixs.push(unstakeBasisIx);
                tx = (_a = new web3_js_1.Transaction()).add.apply(_a, __spreadArray([], __read(ixs), false));
                return [4 /*yield*/, connection.getRecentBlockhash()];
            case 4:
                blockhash = (_b.sent()).blockhash;
                tx.recentBlockhash = blockhash;
                tx.feePayer = payer.publicKey;
                tx.sign(payer);
                return [4 /*yield*/, connection.sendRawTransaction(tx.serialize(), { skipPreflight: false })];
            case 5:
                txHash = _b.sent();
                return [4 /*yield*/, connection.confirmTransaction(txHash, 'processed')];
            case 6:
                _b.sent();
                console.log("successfully unstaked ".concat(amount, " rBasis: ").concat(txHash));
                return [2 /*return*/, txHash];
        }
    });
}); };
exports.unstakeBasis = unstakeBasis;
/*
NOTE: IDL
{
  "version": "0.1.0",
  "name": "basis_staking",
  "instructions": [
    {
      "name": "initialise",
      "accounts": [
        {
          "name": "stakingAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "stakingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "redeemableMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "stakingName",
          "type": "string"
        },
        {
          "name": "bumps",
          "type": {
            "defined": "StakingBumps"
          }
        },
        {
          "name": "stakingTimes",
          "type": {
            "defined": "StakingTimes"
          }
        }
      ]
    },
    {
      "name": "reclaimMintAuthority",
      "accounts": [
        {
          "name": "stakingAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "stakingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "redeemableMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "stakingName",
          "type": "string"
        },
        {
          "name": "bumps",
          "type": {
            "defined": "StakingBumps"
          }
        }
      ]
    },
    {
      "name": "stake",
      "accounts": [
        {
          "name": "userAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRedeemable",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "redeemableMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakingAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unstake",
      "accounts": [
        {
          "name": "userAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRedeemable",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "redeemableMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakingAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "emitPrice",
      "accounts": [
        {
          "name": "tokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "redeemableMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakingAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "StakingAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "stakingAuthority",
            "type": "publicKey"
          },
          {
            "name": "stakingName",
            "type": {
              "array": [
                "u8",
                12
              ]
            }
          },
          {
            "name": "stakingTimes",
            "type": {
              "defined": "StakingTimes"
            }
          },
          {
            "name": "bumps",
            "type": {
              "defined": "StakingBumps"
            }
          },
          {
            "name": "tokenMint",
            "type": "publicKey"
          },
          {
            "name": "redeemableMint",
            "type": "publicKey"
          },
          {
            "name": "tokenVault",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "StakingTimes",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "startStaking",
            "type": "i64"
          },
          {
            "name": "endGracePeriod",
            "type": "i64"
          },
          {
            "name": "endStaking",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "StakingBumps",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "stakingAccount",
            "type": "u8"
          },
          {
            "name": "tokenVault",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "PriceChange",
      "fields": [
        {
          "name": "oldTokenPerRedeemableE6",
          "type": "u64",
          "index": false
        },
        {
          "name": "oldTokenPerRedeemable",
          "type": "string",
          "index": false
        },
        {
          "name": "newTokenPerRedeemableE6",
          "type": "u64",
          "index": false
        },
        {
          "name": "newTokenPerRedeemable",
          "type": "string",
          "index": false
        }
      ]
    },
    {
      "name": "Price",
      "fields": [
        {
          "name": "tokenPerRedeemableE6",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenPerRedeemable",
          "type": "string",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "StakingFuture",
      "msg": "Staking must start in the future"
    },
    {
      "code": 6001,
      "name": "SequentialTimes",
      "msg": "Staking times are non-sequential"
    },
    {
      "code": 6002,
      "name": "StartStakingTime",
      "msg": "Staking has not started"
    },
    {
      "code": 6003,
      "name": "GracePeriodTime",
      "msg": "Within the grace period"
    },
    {
      "code": 6004,
      "name": "EndStakingTime",
      "msg": "Staking has ended"
    },
    {
      "code": 6005,
      "name": "StakingNotOver",
      "msg": "Staking has not finished yet"
    },
    {
      "code": 6006,
      "name": "LowUserTokens",
      "msg": "User holds insufficient tokens"
    },
    {
      "code": 6007,
      "name": "LowUserRedeemable",
      "msg": "User holds insufficient redeemable tokens"
    }
  ],
  "metadata": {
    "address": "FTH1V7jAETZfDgHiL4hJudKXtV8tqKN1WEnkyY4kNAAC"
  }
}
*/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoickJhc2lzU3dhcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWJzL3Vud3JhcC9iYXNpcy9yQmFzaXNTd2FwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQ0FJMkI7QUFDM0IsMkNBTXlCO0FBQ3pCLG9DQUE4QztBQUM5Qyw2REFBcUc7QUFFOUYsSUFBTSx5QkFBeUIsR0FBRyxVQUFPLFVBQXNCLEVBQUUsS0FBYzs7Ozs7Z0JBQzlFLFlBQVksR0FBRyxJQUFJLG1CQUFTLENBQUMscUJBQVcsQ0FBQyxDQUFDO2dCQUU1QixxQkFBTSxJQUFBLHdCQUFnQixFQUFDLFVBQVUsRUFBRSxZQUFZLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFBOztnQkFBL0UsV0FBVyxHQUFHLFNBQWlFO3FCQUNqRixXQUFXLEVBQVgsd0JBQVc7Z0JBQ2IscUJBQU0sSUFBQSxvQkFBWSxFQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLFdBQVcsQ0FBQyxFQUFBOztnQkFBaEUsU0FBZ0UsQ0FBQzs7Ozs7S0FFcEUsQ0FBQztBQVBXLFFBQUEseUJBQXlCLDZCQU9wQztBQUVLLElBQU0sWUFBWSxHQUFHLFVBQzFCLFVBQXNCLEVBQ3RCLEtBQWMsRUFDZCxJQUFlLEVBQ2YsTUFBYzs7Ozs7O2dCQUVkLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQWEsTUFBTSxZQUFTLENBQUMsQ0FBQztnQkFDcEMsR0FBRyxHQUE2QixFQUFFLENBQUM7Z0JBRW5CLHFCQUFNLGlCQUFLLENBQUMseUJBQXlCLENBQ3pELHVDQUEyQixFQUMzQiw0QkFBZ0IsRUFDaEIsSUFBSSxtQkFBUyxDQUFDLElBQUksQ0FBQyxFQUNuQixLQUFLLENBQUMsU0FBUyxDQUNoQixFQUFBOztnQkFMSyxhQUFhLEdBQUcsU0FLckI7Z0JBR29C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