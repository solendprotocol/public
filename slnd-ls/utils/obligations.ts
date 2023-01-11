import {
    Connection,
    PublicKey,
} from "@solana/web3.js";
import BN from "bn.js";
import { PoolType } from "stores/pools";
import { Obligation, parseObligation } from "../../solend-sdk/src/state";
import { getBatchMultipleAccountsInfo } from "./common";
import { simulateRefreshObligation } from "./simulateTransaction";

export type Position = {
    reserveAddress: PublicKey,
    amount: BN,
}

export type ObligationType = {
    address: PublicKey;
    poolAddress: PublicKey;
    deposits: Array<Position>;
    borrows: Array<Position>;
}

export async function fetchSimulatedObligationByAddress(
    obligationAddress: PublicKey,
    connection: Connection,
    pool: PoolType,
) {
    const parsedObligation = await simulateRefreshObligation(pool, connection, obligationAddress);
    if (!parsedObligation) {
        return null;
    }

    return {
        address: obligationAddress,
        poolAddress: parsedObligation.info.lendingMarket,
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
        poolAddress: parsedObligation.info.lendingMarket,
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

export async function fetchObligationsByAddress(
    obligationAddresses: Array<PublicKey>,
    connection: Connection,
) {
    const rawObligations = await getBatchMultipleAccountsInfo(obligationAddresses, connection);

    const parsedObligations = rawObligations.map((obligation, index) => obligation ? parseObligation(
        obligationAddresses[index],
        obligation
    ): null).filter(Boolean) as Array<{info: Obligation, pubkey: PublicKey}>;

    return parsedObligations.map(obligation => ({
        address: obligation.pubkey,
        poolAddress: obligation.info.lendingMarket,
        deposits: obligation.info.deposits.map(d => ({
            reserveAddress: d.depositReserve,
            amount: d.depositedAmount,
        })),
        borrows: obligation.info.borrows.map(b => ({
            reserveAddress: b.borrowReserve,
            amount: b.borrowedAmountWads,
        })),
    }))
}