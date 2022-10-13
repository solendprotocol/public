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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unstakeBasisInstruction = exports.PROGRAM_BASIS_STAKING_VAULT = exports.PROGRAM_BASIS_STAKING_INSTANCE = exports.PROGRAM_BASIS_STAKING = exports.MINT_RBASIS = exports.MINT_BASIS = exports.sighash = void 0;
var spl_token_1 = require("@solana/spl-token");
var web3_js_1 = require("@solana/web3.js");
var bn_js_1 = __importDefault(require("bn.js"));
var BufferLayout = __importStar(require("buffer-layout"));
var js_sha256_1 = require("js-sha256");
var Layout = __importStar(require("libs/layout"));
var snake_case_1 = require("snake-case");
var instruction_1 = require("./instruction");
// NOTE: LIFTED FROM ANCHOR
function sighash(nameSpace, ixName) {
    var name = (0, snake_case_1.snakeCase)(ixName);
    var preimage = "".concat(nameSpace, ":").concat(name);
    return Buffer.from(js_sha256_1.sha256.digest(preimage)).slice(0, 8);
}
exports.sighash = sighash;
// CONSTANTS
// NOTE: did not use the usual getTokenInfo pattern as not sure how useful
// an abstract redemption is as staking contracts aren't universal
var SIGHASH_GLOBAL_NAMESPACE = 'global';
exports.MINT_BASIS = 'Basis9oJw9j8cw53oMV7iqsgo6ihi9ALw4QR31rcjUJa';
exports.MINT_RBASIS = 'rBsH9ME52axhqSjAVXY3t1xcCrmntVNvP3X16pRjVdM';
exports.PROGRAM_BASIS_STAKING = 'FTH1V7jAETZfDgHiL4hJudKXtV8tqKN1WEnkyY4kNAAC';
exports.PROGRAM_BASIS_STAKING_INSTANCE = 'HXCJ1tWowNNNUSrtoVnxT3y9ue1tkuaLNbFMM239zm1y';
exports.PROGRAM_BASIS_STAKING_VAULT = '3sBX8hj4URsiBCSRV26fEHkake295fQnM44EYKKsSs51';
var unstakeBasisInstruction = function (amount, userAuthority, userToken, userRedeemable) {
    var dataLayout = BufferLayout.struct([
        Layout.uint64('amount'),
    ]);
    var data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        amount: new bn_js_1.default(amount),
    }, data);
    // userAuthority    M[ ] S[x]
    // userToken        M[x] S[ ]
    // userRedeemable   M[x] S[ ]
    // redeemableMint   M[x] S[ ]
    // tokenMint        M[ ] S[ ]
    // stakingAccount   M[ ] S[ ]
    // tokenVault       M[x] S[ ]
    // tokenProgram     M[ ] S[ ]
    var keys = [
        { pubkey: userAuthority, isSigner: true, isWritable: false },
        { pubkey: userToken, isSigner: false, isWritable: true },
        { pubkey: userRedeemable, isSigner: false, isWritable: true },
        { pubkey: new web3_js_1.PublicKey(exports.MINT_RBASIS), isSigner: false, isWritable: true },
        { pubkey: new web3_js_1.PublicKey(exports.MINT_BASIS), isSigner: false, isWritable: false },
        { pubkey: new web3_js_1.PublicKey(exports.PROGRAM_BASIS_STAKING_INSTANCE), isSigner: false, isWritable: false },
        { pubkey: new web3_js_1.PublicKey(exports.PROGRAM_BASIS_STAKING_VAULT), isSigner: false, isWritable: true },
        { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];
    return new web3_js_1.TransactionInstruction({
        keys: keys,
        programId: new web3_js_1.PublicKey(exports.PROGRAM_BASIS_STAKING),
        data: Buffer.concat([sighash(SIGHASH_GLOBAL_NAMESPACE, instruction_1.StakingInstructionNames[instruction_1.StakingInstruction.unstake]), data]),
    });
};
exports.unstakeBasisInstruction = unstakeBasisInstruction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5zdGFrZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9tb2RlbHMvaW5zdHJ1Y3Rpb25zL2Jhc2lzL3Vuc3Rha2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQ0FBcUQ7QUFDckQsMkNBQW9FO0FBQ3BFLGdEQUF1QjtBQUN2QiwwREFBOEM7QUFDOUMsdUNBQW1DO0FBQ25DLGtEQUFzQztBQUN0Qyx5Q0FBdUM7QUFDdkMsNkNBQTRFO0FBRTVFLDJCQUEyQjtBQUMzQixTQUFnQixPQUFPLENBQUMsU0FBaUIsRUFBRSxNQUFjO0lBQ3ZELElBQU0sSUFBSSxHQUFHLElBQUEsc0JBQVMsRUFBQyxNQUFNLENBQUMsQ0FBQztJQUMvQixJQUFNLFFBQVEsR0FBRyxVQUFHLFNBQVMsY0FBSSxJQUFJLENBQUUsQ0FBQztJQUN4QyxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsa0JBQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzFELENBQUM7QUFKRCwwQkFJQztBQUVELFlBQVk7QUFDWiwwRUFBMEU7QUFDMUUsa0VBQWtFO0FBQ2xFLElBQU0sd0JBQXdCLEdBQUcsUUFBUSxDQUFDO0FBQzdCLFFBQUEsVUFBVSxHQUFHLDhDQUE4QyxDQUFDO0FBQzVELFFBQUEsV0FBVyxHQUFHLDZDQUE2QyxDQUFDO0FBQzVELFFBQUEscUJBQXFCLEdBQUcsOENBQThDLENBQUM7QUFDdkUsUUFBQSw4QkFBOEIsR0FBRyw4Q0FBOEMsQ0FBQztBQUNoRixRQUFBLDJCQUEyQixHQUFHLDhDQUE4QyxDQUFDO0FBRW5GLElBQU0sdUJBQXVCLEdBQUcsVUFDckMsTUFBNEIsRUFDNUIsYUFBd0IsRUFDeEIsU0FBb0IsRUFDcEIsY0FBeUI7SUFFekIsSUFBTSxVQUFVLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQztRQUNyQyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztLQUN4QixDQUFDLENBQUM7SUFFSCxJQUFNLElBQUksR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMzQyxVQUFVLENBQUMsTUFBTSxDQUNmO1FBQ0UsTUFBTSxFQUFFLElBQUksZUFBRSxDQUFDLE1BQU0sQ0FBQztLQUN2QixFQUNELElBQUksQ0FDTCxDQUFDO0lBRUYsNkJBQTZCO0lBQzdCLDZCQUE2QjtJQUM3Qiw2QkFBNkI7SUFDN0IsNkJBQTZCO0lBQzdCLDZCQUE2QjtJQUM3Qiw2QkFBNkI7SUFDN0IsNkJBQTZCO0lBQzdCLDZCQUE2QjtJQUU3QixJQUFNLElBQUksR0FBRztRQUNYLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUU7UUFDNUQsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRTtRQUN4RCxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFO1FBQzdELEVBQUUsTUFBTSxFQUFFLElBQUksbUJBQVMsQ0FBQyxtQkFBVyxDQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFO1FBQ3pFLEVBQUUsTUFBTSxFQUFFLElBQUksbUJBQVMsQ0FBQyxrQkFBVSxDQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFO1FBQ3pFLEVBQUUsTUFBTSxFQUFFLElBQUksbUJBQVMsQ0FBQyxzQ0FBOEIsQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRTtRQUM3RixFQUFFLE1BQU0sRUFBRSxJQUFJLG1CQUFTLENBQUMsbUNBQTJCLENBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUU7UUFDekYsRUFBRSxNQUFNLEVBQUUsNEJBQWdCLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFO0tBQ2pFLENBQUM7SUFFRixPQUFPLElBQUksZ0NBQXNCLENBQUM7UUFDaEMsSUFBSSxNQUFBO1FBQ0osU0FBUyxFQUFFLElBQUksbUJBQVMsQ0FBQyw2QkFBcUIsQ0FBQztRQUMvQyxJQUFJLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsRUFBRSxxQ0FBdUIsQ0FBQyxnQ0FBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ3BILENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQztBQTNDVyxRQUFBLHVCQUF1QiwyQkEyQ2xDIn0=