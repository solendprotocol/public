import {
    Connection,
    PublicKey,
} from "@solana/web3.js";
import { parseObligation, parseReserve, Reserve } from "../../solend-sdk/src/state";
import { LENDING_MARKET_SIZE } from '../../solend-sdk/src/state/lendingMarket'
import { PROGRAM_ID, SOLEND_ADDRESSES } from "./config";

export const getPoolsFromChain = async (connection: Connection) => {
    const filters = [
        { dataSize: LENDING_MARKET_SIZE },
        { memcmp: { offset: 2, bytes: SOLEND_ADDRESSES[0] } },
    ];

    const pools = await connection.getProgramAccounts(PROGRAM_ID, {
        commitment: connection.commitment,
        filters,
        encoding: "base64",
    });

    const poolList = pools.map((pool) => {
        const Pool = {
            address: pool.pubkey.toBase58(),
        };
        return Pool;
    });

    return poolList.map(p => p.address).sort();
};

export const getReservesOfPool = async (lendingMarketPubkey: PublicKey, connection: Connection) => {
    const filters = [
        { dataSize: 619 },
        { memcmp: { offset: 10, bytes: lendingMarketPubkey.toBase58() } },
    ];

    const rawReserves = await connection.getProgramAccounts(PROGRAM_ID, {
        commitment: connection.commitment,
        filters,
        encoding: "base64",
    });

    const parsedReserves = rawReserves.map((reserve, index) => reserve ? parseReserve(
        rawReserves[index].pubkey,
        reserve.account
    ): null).filter(Boolean) as Array<{info: Reserve, pubkey: PublicKey}>;

    return parsedReserves.map((reserve) => ({
        address: reserve.pubkey,
        mintAddress: reserve.info.liquidity.mintPubkey,
        decimals: reserve.info.liquidity.mintDecimals,
        price: reserve.info.liquidity.marketPrice,
        poolAddress: lendingMarketPubkey,
        pythOracle: reserve.info.liquidity.pythOracle,
        switchboardOracle: reserve.info.liquidity.switchboardOracle,
    })).sort((a, b) => a.address.toBase58().localeCompare(b.address.toBase58()));
};