import { AccountInfo, PublicKey } from "@solana/web3.js";
import { parsePriceData } from "@pythnetwork/client";
import SwitchboardProgram from "@switchboard-xyz/sbv2-lite";
import { AggregatorState } from "@switchboard-xyz/switchboard-api/lib/compiled";
import { CONNECTION } from "common/config";

const connection = CONNECTION;
const SBV1_MAINNET = 'DtmE9D2CSB4L5D6A15mraeEjrGMm6auWVzgaD8hK2tZM';
const SBV2_MAINNET = 'SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f';


export const getOracleAddresses = (parsedReserves: ParsedReserve[]) => {
    const oracles = new Map<string, { pyth: string, sb: string }>();
    parsedReserves.forEach((reserve) => {
        const reservePubkey = reserve.pubkey.toBase58();
        const pyth = reserve.info.liquidity.pythOracle.toBase58();
        const sb = reserve.info.liquidity.switchboardOracle.toBase58();
        oracles.set(reservePubkey, { pyth, sb });
    });
    return oracles;
}

export const getAssetPrices = async (oracles: Map<string, { pyth: string; sb: string; }>, sbv2Program: SwitchboardProgram) => {
    const prices = new Map<string, number>();
    const pythAccountsInfo = await getPythAccountsInfo(oracles);
    const sbAccountsInfo = await getSbAccountsInfo(oracles);

    for (const [reserveAddress, { pyth, sb }] of oracles) {
        if (pyth) {
            try {
                const pythAccountInfo = pythAccountsInfo.get(reserveAddress);
                if (pythAccountInfo) {
                    const price = getPriceFromPyth(pythAccountInfo);
                    prices.set(reserveAddress, price);
                    continue;
                }
            } catch { }
        }
        if (sb) {
            try {
                const sbAccountInfo = sbAccountsInfo.get(reserveAddress);
                if (sbAccountInfo) {
                    const price = await getPriceFromSb(sbAccountInfo, sbv2Program);
                    prices.set(reserveAddress, price);
                    continue;
                }
            } catch { }
        }
        prices.set(reserveAddress, 0);
    }

    return prices;
};

const getPythAccountsInfo = async (oracles: Map<string, { pyth: string, sb: string }>) => {
    const accountsInfo = new Map<string, AccountInfo<Buffer> | null>();
    const promises = new Set<Promise<void>>();

    const setAccountsInfo = async (reserveAddress: string, pythAddress: string) => {
        const pythAccountInfo = await connection.getAccountInfo(new PublicKey(pythAddress));
        accountsInfo.set(reserveAddress, pythAccountInfo);
    };

    for (const [reserveAddress, { pyth }] of oracles) {
        promises.add(setAccountsInfo(reserveAddress, pyth));
    }
    await Promise.all(promises);
    return accountsInfo;
};

const getSbAccountsInfo = async (oracles: Map<string, { pyth: string, sb: string }>) => {
    const accountsInfo = new Map<string, AccountInfo<Buffer> | null>();
    const promises = new Set<Promise<void>>();

    const setAccountsInfo = async (reserveAddress: string, sbAddress: string) => {
        const sbAccountInfo = await connection.getAccountInfo(new PublicKey(sbAddress));
        accountsInfo.set(reserveAddress, sbAccountInfo);
    };

    for (const [reserveAddress, { sb }] of oracles) {
        promises.add(setAccountsInfo(reserveAddress, sb));
    }
    await Promise.all(promises);
    return accountsInfo;
};

const getPriceFromPyth = (accountInfo: AccountInfo<Buffer> | null) => {
    if (!accountInfo) {
        throw new Error("Failed to get price account info");
    }
    const priceData = parsePriceData(accountInfo.data);
    if (!priceData || !priceData.price) {
        throw new Error("Failed to parse price data");
    }
    return priceData.price;
};



const getPriceFromSb = async (accountInfo: AccountInfo<Buffer> | null, sbv2: SwitchboardProgram) => {
    if (!accountInfo) {
        throw new Error("Failed to get price account info");
    }
    const owner = accountInfo.owner.toBase58();

    if (owner === SBV1_MAINNET) {
        const sbData = (accountInfo.data as Buffer)?.slice(1);
        const result = AggregatorState.decodeDelimited(sbData);
        const price = result.lastRoundResult?.result;
        if (!price) {
            throw new Error("Failed to parse price data");
        }
        return price;
    }
    else if (owner === SBV2_MAINNET) {
        const latestResult = sbv2.decodeLatestAggregatorValue(accountInfo);
        if (!latestResult) {
            throw new Error(`failed to fetch latest result for aggregator`);
        }
        return latestResult.toNumber();
    }

    throw Error(`Unrecognized switchboard oracle.`);
};