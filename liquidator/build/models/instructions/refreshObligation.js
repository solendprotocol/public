"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshObligationInstruction = void 0;
var web3_js_1 = require("@solana/web3.js");
var buffer_layout_1 = __importDefault(require("buffer-layout"));
var utils_1 = require("libs/utils");
var instruction_1 = require("./instruction");
/// Refresh an obligation"s accrued interest and collateral and liquidity prices. Requires
/// refreshed reserves, as all obligation collateral deposit reserves in order, followed by all
/// liquidity borrow reserves in order.
/// Accounts expected by this instruction:
///   0. `[writable]` Obligation account.
///   1. `[]` Clock sysvar.
///   .. `[]` Collateral deposit reserve accounts - refreshed, all, in order.
///   .. `[]` Liquidity borrow reserve accounts - refreshed, all, in order.
var refreshObligationInstruction = function (obligation, depositReserves, borrowReserves) {
    var dataLayout = buffer_layout_1.default.struct([buffer_layout_1.default.u8('instruction')]);
    var data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({ instruction: instruction_1.LendingInstruction.RefreshObligation }, data);
    var keys = [
        { pubkey: obligation, isSigner: false, isWritable: true },
        { pubkey: web3_js_1.SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    ];
    depositReserves.forEach(function (depositReserve) {
        keys.push({ pubkey: depositReserve, isSigner: false, isWritable: false });
    });
    borrowReserves.forEach(function (borrowReserve) {
        keys.push({ pubkey: borrowReserve, isSigner: false, isWritable: false });
    });
    return new web3_js_1.TransactionInstruction({
        keys: keys,
        programId: new web3_js_1.PublicKey((0, utils_1.getProgramIdForCurrentDeployment)()),
        data: data,
    });
};
exports.refreshObligationInstruction = refreshObligationInstruction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmcmVzaE9ibGlnYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbW9kZWxzL2luc3RydWN0aW9ucy9yZWZyZXNoT2JsaWdhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwyQ0FJeUI7QUFDekIsZ0VBQXlDO0FBQ3pDLG9DQUE4RDtBQUM5RCw2Q0FBbUQ7QUFFbkQsMEZBQTBGO0FBQzFGLCtGQUErRjtBQUMvRix1Q0FBdUM7QUFDdkMsMENBQTBDO0FBQzFDLHlDQUF5QztBQUN6QywyQkFBMkI7QUFDM0IsNkVBQTZFO0FBQzdFLDJFQUEyRTtBQUNwRSxJQUFNLDRCQUE0QixHQUFHLFVBQzFDLFVBQXFCLEVBQ3JCLGVBQTRCLEVBQzVCLGNBQTJCO0lBRTNCLElBQU0sVUFBVSxHQUFHLHVCQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsdUJBQVksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXpFLElBQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzNDLFVBQVUsQ0FBQyxNQUFNLENBQ2YsRUFBRSxXQUFXLEVBQUUsZ0NBQWtCLENBQUMsaUJBQWlCLEVBQUUsRUFDckQsSUFBSSxDQUNMLENBQUM7SUFFRixJQUFNLElBQUksR0FBRztRQUNYLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUU7UUFDekQsRUFBRSxNQUFNLEVBQUUsNkJBQW1CLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFO0tBQ3BFLENBQUM7SUFFRixlQUFlLENBQUMsT0FBTyxDQUFDLFVBQUMsY0FBYztRQUNyQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQzVFLENBQUMsQ0FBQyxDQUFDO0lBRUgsY0FBYyxDQUFDLE9BQU8sQ0FBQyxVQUFDLGFBQWE7UUFDbkMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUMzRSxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sSUFBSSxnQ0FBc0IsQ0FBQztRQUNoQyxJQUFJLE1BQUE7UUFDSixTQUFTLEVBQUUsSUFBSSxtQkFBUyxDQUFDLElBQUEsd0NBQWdDLEdBQUUsQ0FBQztRQUM1RCxJQUFJLE1BQUE7S0FDTCxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUM7QUEvQlcsUUFBQSw0QkFBNEIsZ0NBK0J2QyJ9