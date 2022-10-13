"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LendingInstruction = void 0;
var LendingInstruction;
(function (LendingInstruction) {
    LendingInstruction[LendingInstruction["InitLendingMarket"] = 0] = "InitLendingMarket";
    LendingInstruction[LendingInstruction["SetLendingMarketOwner"] = 1] = "SetLendingMarketOwner";
    LendingInstruction[LendingInstruction["InitReserve"] = 2] = "InitReserve";
    LendingInstruction[LendingInstruction["RefreshReserve"] = 3] = "RefreshReserve";
    LendingInstruction[LendingInstruction["DepositReserveLiquidity"] = 4] = "DepositReserveLiquidity";
    LendingInstruction[LendingInstruction["RedeemReserveCollateral"] = 5] = "RedeemReserveCollateral";
    LendingInstruction[LendingInstruction["InitObligation"] = 6] = "InitObligation";
    LendingInstruction[LendingInstruction["RefreshObligation"] = 7] = "RefreshObligation";
    LendingInstruction[LendingInstruction["DepositObligationCollateral"] = 8] = "DepositObligationCollateral";
    LendingInstruction[LendingInstruction["WithdrawObligationCollateral"] = 9] = "WithdrawObligationCollateral";
    LendingInstruction[LendingInstruction["BorrowObligationLiquidity"] = 10] = "BorrowObligationLiquidity";
    LendingInstruction[LendingInstruction["RepayObligationLiquidity"] = 11] = "RepayObligationLiquidity";
    LendingInstruction[LendingInstruction["LiquidateObligation"] = 12] = "LiquidateObligation";
    LendingInstruction[LendingInstruction["FlashLoan"] = 13] = "FlashLoan";
    LendingInstruction[LendingInstruction["DepositReserveLiquidityAndObligationCollateral"] = 14] = "DepositReserveLiquidityAndObligationCollateral";
    LendingInstruction[LendingInstruction["WithdrawObligationCollateralAndRedeemReserveLiquidity"] = 15] = "WithdrawObligationCollateralAndRedeemReserveLiquidity";
    LendingInstruction[LendingInstruction["UpdateReserveConfig"] = 16] = "UpdateReserveConfig";
    LendingInstruction[LendingInstruction["LiquidateObligationAndRedeemReserveCollateral"] = 17] = "LiquidateObligationAndRedeemReserveCollateral";
})(LendingInstruction = exports.LendingInstruction || (exports.LendingInstruction = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbW9kZWxzL2luc3RydWN0aW9ucy9pbnN0cnVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxJQUFZLGtCQW1CWDtBQW5CRCxXQUFZLGtCQUFrQjtJQUM1QixxRkFBcUIsQ0FBQTtJQUNyQiw2RkFBeUIsQ0FBQTtJQUN6Qix5RUFBZSxDQUFBO0lBQ2YsK0VBQWtCLENBQUE7SUFDbEIsaUdBQTJCLENBQUE7SUFDM0IsaUdBQTJCLENBQUE7SUFDM0IsK0VBQWtCLENBQUE7SUFDbEIscUZBQXFCLENBQUE7SUFDckIseUdBQStCLENBQUE7SUFDL0IsMkdBQWdDLENBQUE7SUFDaEMsc0dBQThCLENBQUE7SUFDOUIsb0dBQTZCLENBQUE7SUFDN0IsMEZBQXdCLENBQUE7SUFDeEIsc0VBQWMsQ0FBQTtJQUNkLGdKQUFtRCxDQUFBO0lBQ25ELDhKQUEwRCxDQUFBO0lBQzFELDBGQUF3QixDQUFBO0lBQ3hCLDhJQUFrRCxDQUFBO0FBQ3BELENBQUMsRUFuQlcsa0JBQWtCLEdBQWxCLDBCQUFrQixLQUFsQiwwQkFBa0IsUUFtQjdCIn0=