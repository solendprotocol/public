import { Connection, PublicKey, Transaction, TransactionSignature } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { ObligationType } from "stores/obligations";
import { ReserveType, SelectedReserveType } from "stores/pools";
import { SolendAction } from "../../../solend-sdk/src/classes/action";

export const supplyConfigs = {
    action: async (
        value: string,
        publicKey: string,
        selectedReserve: ReserveType,
        connection: Connection,
        sendTransaction: (
            txn: Transaction,
            connection: Connection
          ) => Promise<TransactionSignature>,
    ) => {
        if (value && publicKey && selectedReserve) {
            const solendAction = await SolendAction.buildDepositTxns(
                connection,
                value,
                'SOL',
                new PublicKey(publicKey),
                "production",
                new PublicKey(selectedReserve.poolAddress)
            );

            return solendAction.sendTransactions(sendTransaction);
            }

    },
    // calculateMax: (obligation: ObligationType, reserve: SelectedReserveType)  => {
    //     const supplyCapRemaining = new BigNumber.max(
    //         reserveSupplyCap.subtract(totalSupply).subtract(new BNumber(0.2)),
    //       BZero,
    //     );  
      
    //     const maxSuppliableFromWallet =
    //       selectedToken.symbol === 'SOL'
    //         ? max(walletBalance.subtract(SOL_PADDING_FOR_RENT_AND_FEE), BZero)
    //         : walletBalance;
      
    //     const maxSupplyValue = publicKey
    //       ? min(maxSuppliableFromWallet, userSupplyCapRemaining)
    //       : BZero;
      
    // };
}