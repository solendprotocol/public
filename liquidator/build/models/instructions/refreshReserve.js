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
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshReserveInstruction = void 0;
var web3_js_1 = require("@solana/web3.js");
var BufferLayout = __importStar(require("buffer-layout"));
var utils_1 = require("libs/utils");
var instruction_1 = require("./instruction");
/// Accrue interest and update market price of liquidity on a reserve.
/// Accounts expected by this instruction:
///   0. `[writable]` Reserve account.
///   1. `[]` Clock sysvar.
///   2. `[optional]` Reserve liquidity oracle account.
///                     Required if the reserve currency is not the lending market quote
///                     currency.
var refreshReserveInstruction = function (reserve, oracle, switchboardFeedAddress) {
    var dataLayout = BufferLayout.struct([BufferLayout.u8('instruction')]);
    var data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({ instruction: instruction_1.LendingInstruction.RefreshReserve }, data);
    var keys = [{ pubkey: reserve, isSigner: false, isWritable: true }];
    if (oracle) {
        keys.push({ pubkey: oracle, isSigner: false, isWritable: false });
    }
    if (switchboardFeedAddress) {
        keys.push({
            pubkey: switchboardFeedAddress,
            isSigner: false,
            isWritable: false,
        });
    }
    keys.push({
        pubkey: web3_js_1.SYSVAR_CLOCK_PUBKEY,
        isSigner: false,
        isWritable: false,
    });
    return new web3_js_1.TransactionInstruction({
        keys: keys,
        programId: new web3_js_1.PublicKey((0, utils_1.getProgramIdForCurrentDeployment)()),
        data: data,
    });
};
exports.refreshReserveInstruction = refreshReserveInstruction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmcmVzaFJlc2VydmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbW9kZWxzL2luc3RydWN0aW9ucy9yZWZyZXNoUmVzZXJ2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJDQUl5QjtBQUN6QiwwREFBOEM7QUFDOUMsb0NBQThEO0FBQzlELDZDQUFtRDtBQUVuRCxzRUFBc0U7QUFDdEUsMENBQTBDO0FBQzFDLHNDQUFzQztBQUN0QywyQkFBMkI7QUFDM0IsdURBQXVEO0FBQ3ZELHdGQUF3RjtBQUN4RixpQ0FBaUM7QUFDMUIsSUFBTSx5QkFBeUIsR0FBRyxVQUN2QyxPQUFrQixFQUNsQixNQUFrQixFQUNsQixzQkFBa0M7SUFFbEMsSUFBTSxVQUFVLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXpFLElBQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzNDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxXQUFXLEVBQUUsZ0NBQWtCLENBQUMsY0FBYyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFFNUUsSUFBTSxJQUFJLEdBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUV0RSxJQUFJLE1BQU0sRUFBRTtRQUNWLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7S0FDbkU7SUFFRCxJQUFJLHNCQUFzQixFQUFFO1FBQzFCLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDUixNQUFNLEVBQUUsc0JBQXNCO1lBQzlCLFFBQVEsRUFBRSxLQUFLO1lBQ2YsVUFBVSxFQUFFLEtBQUs7U0FDbEIsQ0FBQyxDQUFDO0tBQ0o7SUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ1IsTUFBTSxFQUFFLDZCQUFtQjtRQUMzQixRQUFRLEVBQUUsS0FBSztRQUNmLFVBQVUsRUFBRSxLQUFLO0tBQ2xCLENBQUMsQ0FBQztJQUVILE9BQU8sSUFBSSxnQ0FBc0IsQ0FBQztRQUNoQyxJQUFJLE1BQUE7UUFDSixTQUFTLEVBQUUsSUFBSSxtQkFBUyxDQUFDLElBQUEsd0NBQWdDLEdBQUUsQ0FBQztRQUM1RCxJQUFJLE1BQUE7S0FDTCxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUM7QUFuQ1csUUFBQSx5QkFBeUIsNkJBbUNwQyJ9