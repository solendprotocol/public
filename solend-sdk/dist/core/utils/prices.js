"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPrices = void 0;
const client_1 = require("@pythnetwork/client");
const utils_1 = require("./utils");
const SBV2_MAINNET = "SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f";
async function fetchPrices(parsedReserves, connection, switchboardProgram, debug) {
    if (debug)
        console.log("fetchPrices");
    const oracles = parsedReserves
        .map((reserve) => reserve.info.liquidity.pythOracle)
        .concat(parsedReserves.map((reserve) => reserve.info.liquidity.switchboardOracle));
    const priceAccounts = await (0, utils_1.getBatchMultipleAccountsInfo)(oracles, connection);
    return parsedReserves.reduce((acc, reserve, i) => {
        const pythOracleData = priceAccounts[i];
        const switchboardOracleData = priceAccounts[parsedReserves.length + i];
        let priceData;
        if (pythOracleData) {
            const { price, previousPrice, emaPrice } = (0, client_1.parsePriceData)(pythOracleData.data);
            if (price || previousPrice) {
                // use latest price if available otherwise fallback to previous
                priceData = {
                    spotPrice: price || previousPrice,
                    emaPrice: emaPrice?.value ?? (price || previousPrice),
                };
            }
        }
        // Only attempt to fetch from switchboard if not already available from pyth
        if (!priceData) {
            const rawSb = switchboardOracleData;
            const switchboardData = switchboardOracleData?.data?.slice(1);
            if (rawSb && switchboardData) {
                const owner = rawSb.owner.toString();
                if (owner === SBV2_MAINNET) {
                    const result = switchboardProgram.decodeLatestAggregatorValue(rawSb);
                    priceData = {
                        spotPrice: result?.toNumber() ?? 0,
                        emaPrice: result?.toNumber() ?? 0,
                    };
                }
            }
        }
        return {
            ...acc,
            [reserve.pubkey.toBase58()]: priceData,
        };
    }, {});
}
exports.fetchPrices = fetchPrices;
