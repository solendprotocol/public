import {
    Connection,
    PublicKey,
} from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { PoolType } from "stores/pools";
import { Obligation, parseObligation } from "../../solend-sdk/src/state";
import { getBatchMultipleAccountsInfo } from "./common";
import { simulateRefreshObligation } from "./simulateTransaction";

function formatObligation(obligation: {
    pubkey: PublicKey,
    info: Obligation
}) {
    const poolAddress = obligation.info.lendingMarket.toBase58();
    const totalSupplyValue = new BigNumber(obligation.info.depositedValue.toString()).shiftedBy(-18);
    const totalBorrowValue = new BigNumber(obligation.info.borrowedValue.toString()).shiftedBy(-18);
    const borrowLimit = new BigNumber(obligation.info.allowedBorrowValue.toString()).shiftedBy(-18);
    const liquidationThreshold = new BigNumber(obligation.info.unhealthyBorrowValue.toString()).shiftedBy(-18);
    const netAccountValue = totalSupplyValue.minus(totalBorrowValue);
    const liquidationThresholdFactor =  totalSupplyValue.isZero() ? new BigNumber(0) : liquidationThreshold.dividedBy(totalSupplyValue);
    const borrowLimitFactor = totalSupplyValue.isZero() ? new BigNumber(0) : borrowLimit.dividedBy(totalSupplyValue);
    const borrowUtilization = borrowLimit.isZero() ? new BigNumber(0) : totalBorrowValue.dividedBy(borrowLimit);
    const isBorrowLimitReached = borrowUtilization.isGreaterThanOrEqualTo(
        new BigNumber('1'),
      );
    const borrowOverSupply = totalSupplyValue.isZero() ? new BigNumber(0) : totalBorrowValue.dividedBy(totalSupplyValue);
    const borrowLimitOverSupply = totalSupplyValue.isZero() ? new BigNumber(0) : borrowLimit.dividedBy(totalSupplyValue);

    return {
        address: obligation.pubkey.toBase58(),
        deposits: obligation.info.deposits.map(d => ({
            reserveAddress: d.depositReserve.toBase58(),
            amount: new BigNumber(d.depositedAmount.toString()),
        })),
        borrows: obligation.info.borrows.map(b => ({
            reserveAddress: b.borrowReserve.toBase58(),
            amount: new BigNumber(b.borrowedAmountWads.toString()),
        })),
        poolAddress,
        totalSupplyValue,
        totalBorrowValue,
        borrowLimit,
        liquidationThreshold,
        netAccountValue,
        liquidationThresholdFactor,
        borrowLimitFactor,
        borrowUtilization,
        isBorrowLimitReached,
        borrowOverSupply,
        borrowLimitOverSupply,
    }
}

export async function fetchSimulatedObligationByAddress(
    obligationAddress: string,
    connection: Connection,
    pool: PoolType,
) {

    const parsedObligation = await simulateRefreshObligation(pool, connection, new PublicKey(obligationAddress));
    if (!parsedObligation) {
        return null;
    }

    return formatObligation(parsedObligation)
}

export async function fetchObligationByAddress(
    obligationAddress: string,
    connection: Connection,
) {
    const rawObligationData = await connection.getAccountInfo(
        new PublicKey(obligationAddress)
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

    return formatObligation(parsedObligation);
}

export async function fetchObligationsByAddress(
    obligationAddresses: Array<string>,
    connection: Connection,
) {
    const rawObligations = await getBatchMultipleAccountsInfo(obligationAddresses, connection);

    const parsedObligations = rawObligations.map((obligation, index) => obligation ? parseObligation(
        new PublicKey(obligationAddresses[index]),
        obligation
    ): null).filter(Boolean) as Array<{info: Obligation, pubkey: PublicKey}>;

    return parsedObligations.map(obligation => formatObligation(obligation))
}