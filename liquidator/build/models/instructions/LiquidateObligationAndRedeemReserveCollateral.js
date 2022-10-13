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
exports.LiquidateObligationAndRedeemReserveCollateral = void 0;
var spl_token_1 = require("@solana/spl-token");
var web3_js_1 = require("@solana/web3.js");
var bn_js_1 = __importDefault(require("bn.js"));
var BufferLayout = __importStar(require("buffer-layout"));
var Layout = __importStar(require("libs/layout"));
var utils_1 = require("libs/utils");
var instruction_1 = require("./instruction");
/// Repay borrowed liquidity to a reserve to receive collateral at a discount from an unhealthy
/// obligation. Requires a refreshed obligation and reserves.
/// Accounts expected by this instruction:
///   0. `[writable]` Source liquidity token account.
///                     Minted by repay reserve liquidity mint.
///                     $authority can transfer $liquidity_amount.
///   1. `[writable]` Destination collateral token account.
///                     Minted by withdraw reserve collateral mint.
///   2. `[writable]` Destination liquidity token account.
///   3. `[writable]` Repay reserve account - refreshed.
///   4. `[writable]` Repay reserve liquidity supply SPL Token account.
///   5. `[writable]` Withdraw reserve account - refreshed.
///   6. `[writable]` Withdraw reserve collateral SPL Token mint.
///   7. `[writable]` Withdraw reserve collateral supply SPL Token account.
///   8. `[writable]` Withdraw reserve liquidity supply SPL Token account.
///   9. `[writable]` Withdraw reserve liquidity fee receiver account.
///   10 `[writable]` Obligation account - refreshed.
///   11 `[]` Lending market account.
///   12 `[]` Derived lending market authority.
///   13 `[signer]` User transfer authority ($authority).
///   14 `[]` Token program id.
var LiquidateObligationAndRedeemReserveCollateral = function (liquidityAmount, sourceLiquidity, destinationCollateral, destinationRewardLiquidity, repayReserve, repayReserveLiquiditySupply, withdrawReserve, withdrawReserveCollateralMint, withdrawReserveCollateralSupply, withdrawReserveLiquiditySupply, withdrawReserveFeeReceiver, obligation, lendingMarket, lendingMarketAuthority, transferAuthority) {
    var dataLayout = BufferLayout.struct([
        BufferLayout.u8('instruction'),
        Layout.uint64('liquidityAmount'),
    ]);
    var data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: instruction_1.LendingInstruction.LiquidateObligationAndRedeemReserveCollateral,
        liquidityAmount: new bn_js_1.default(liquidityAmount),
    }, data);
    var keys = [
        { pubkey: sourceLiquidity, isSigner: false, isWritable: true },
        { pubkey: destinationCollateral, isSigner: false, isWritable: true },
        { pubkey: destinationRewardLiquidity, isSigner: false, isWritable: true },
        { pubkey: repayReserve, isSigner: false, isWritable: true },
        { pubkey: repayReserveLiquiditySupply, isSigner: false, isWritable: true },
        { pubkey: withdrawReserve, isSigner: false, isWritable: true },
        { pubkey: withdrawReserveCollateralMint, isSigner: false, isWritable: true },
        {
            pubkey: withdrawReserveCollateralSupply,
            isSigner: false,
            isWritable: true,
        },
        { pubkey: withdrawReserveLiquiditySupply, isSigner: false, isWritable: true },
        { pubkey: withdrawReserveFeeReceiver, isSigner: false, isWritable: true },
        { pubkey: obligation, isSigner: false, isWritable: true },
        { pubkey: lendingMarket, isSigner: false, isWritable: false },
        { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
        { pubkey: transferAuthority, isSigner: true, isWritable: false },
        { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];
    return new web3_js_1.TransactionInstruction({
        keys: keys,
        programId: new web3_js_1.PublicKey((0, utils_1.getProgramIdForCurrentDeployment)()),
        data: data,
    });
};
exports.LiquidateObligationAndRedeemReserveCollateral = LiquidateObligationAndRedeemReserveCollateral;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGlxdWlkYXRlT2JsaWdhdGlvbkFuZFJlZGVlbVJlc2VydmVDb2xsYXRlcmFsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL21vZGVscy9pbnN0cnVjdGlvbnMvTGlxdWlkYXRlT2JsaWdhdGlvbkFuZFJlZGVlbVJlc2VydmVDb2xsYXRlcmFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0NBQXFEO0FBQ3JELDJDQUV5QjtBQUN6QixnREFBdUI7QUFDdkIsMERBQThDO0FBQzlDLGtEQUFzQztBQUN0QyxvQ0FBOEQ7QUFDOUQsNkNBQW1EO0FBRW5ELCtGQUErRjtBQUMvRiw2REFBNkQ7QUFDN0QsMENBQTBDO0FBQzFDLHFEQUFxRDtBQUNyRCwrREFBK0Q7QUFDL0Qsa0VBQWtFO0FBQ2xFLDJEQUEyRDtBQUMzRCxtRUFBbUU7QUFDbkUsMERBQTBEO0FBQzFELHdEQUF3RDtBQUN4RCx1RUFBdUU7QUFDdkUsMkRBQTJEO0FBQzNELGlFQUFpRTtBQUNqRSwyRUFBMkU7QUFDM0UsMEVBQTBFO0FBQzFFLHNFQUFzRTtBQUN0RSxxREFBcUQ7QUFDckQscUNBQXFDO0FBQ3JDLCtDQUErQztBQUMvQyx5REFBeUQ7QUFDekQsK0JBQStCO0FBQ3hCLElBQU0sNkNBQTZDLEdBQUcsVUFDM0QsZUFBcUMsRUFDckMsZUFBMEIsRUFDMUIscUJBQWdDLEVBQ2hDLDBCQUFxQyxFQUNyQyxZQUF1QixFQUN2QiwyQkFBc0MsRUFDdEMsZUFBMEIsRUFDMUIsNkJBQXdDLEVBQ3hDLCtCQUEwQyxFQUMxQyw4QkFBeUMsRUFDekMsMEJBQXFDLEVBQ3JDLFVBQXFCLEVBQ3JCLGFBQXdCLEVBQ3hCLHNCQUFpQyxFQUNqQyxpQkFBNEI7SUFFNUIsSUFBTSxVQUFVLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQztRQUNyQyxZQUFZLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQztRQUM5QixNQUFNLENB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