import {
    Connection,
    PublicKey,
} from "@solana/web3.js";
import BN from "bn.js";
import { parseObligation } from "../../solend-sdk/src/state";
import { LENDING_MARKET_SIZE } from '../../solend-sdk/src/state/lendingMarket'
import { PROGRAM_ID, SOLEND_ADDRESSES } from "./config";

export type Position = {
    reserveAddress: PublicKey,
    amount: BN,
}

export type ObligationType = {
    address: PublicKey;
    deposits: Array<Position>;
    borrows: Array<Position>;
    // obligationStats: ObligationStats;
}

export async function fetchObligationByAddress(
    obligationAddress: PublicKey,
    connection: Connection,
) {
    const rawObligationData = await connection.getAccountInfo(
        obligationAddress
    );

    if (!rawObligationData) {
        return null;
    }

    const parsedObligation = parseObligation(
        PublicKey.default,
        rawObligationData!
    );

    if (!parsedObligation) {
        return null;
    }

    return {
        address: obligationAddress,
        deposits: parsedObligation.info.deposits.map(d => ({
            reserveAddress: d.depositReserve,
            amount: d.depositedAmount,
        })),
        borrows: parsedObligation.info.borrows.map(b => ({
            reserveAddress: b.borrowReserve,
            amount: b.borrowedAmountWads,
        })),
    }
}