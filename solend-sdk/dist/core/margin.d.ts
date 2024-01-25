/// <reference types="@project-serum/anchor/node_modules/@solana/web3.js" />
/// <reference types="@pythnetwork/client/node_modules/@solana/web3.js" />
import { AddressLookupTableAccount, Connection, PublicKey, TransactionInstruction, VersionedTransaction } from "@solana/web3.js";
import { ObligationType, PoolType, ReserveType } from ".";
import BN from "bn.js";
import JSBI from "jsbi";
export declare class Margin {
    connection: Connection;
    obligation?: ObligationType;
    owner: PublicKey;
    obligationAddress: PublicKey;
    longReserve: ReserveType;
    shortReserve: ReserveType;
    pool: PoolType;
    collateralReserve?: ReserveType;
    longReserveLiquidityAta: PublicKey;
    longReserveCollateralAta: PublicKey;
    shortReserveLiquidityAta: PublicKey;
    shortReserveCollateralAta: PublicKey;
    obligationSeed: string;
    lendingMarketAuthority: PublicKey;
    depositKeys: Array<PublicKey>;
    borrowKeys: Array<PublicKey>;
    constructor(connection: Connection, owner: PublicKey, longReserve: ReserveType, shortReserve: ReserveType, pool: PoolType, obligationAddress: PublicKey, obligationSeed: string, obligation?: ObligationType, collateralReserve?: ReserveType);
    calculateMaxUserBorrowPower: () => number;
    setupTx: (depositCollateralConfig?: {
        collateralReserve: ReserveType;
        amount: string;
    }) => Promise<{
        tx: VersionedTransaction;
        obligationAddress: PublicKey;
    }>;
    getSolendAccountCount: () => number;
    leverTx: (swapBaseAmount: BN, route: {
        outAmount: JSBI;
        slippageBps: number;
    }, swapInstructions: Array<TransactionInstruction>, lookupTableAccounts: AddressLookupTableAccount[]) => Promise<VersionedTransaction>;
}
