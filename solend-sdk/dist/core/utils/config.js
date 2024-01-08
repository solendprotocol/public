"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPoolMetadataFromChain = exports.fetchPoolMetadata = void 0;
const web3_js_1 = require("@solana/web3.js");
const state_1 = require("../../state");
const constants_1 = require("../constants");
const utils_1 = require("./utils");
async function fetchPoolMetadata(connection, environment = "production", useApi, debug) {
    if (debug)
        console.log("fetchConfig");
    const programId = (0, constants_1.getProgramId)(environment);
    if (!useApi)
        return (0, exports.fetchPoolMetadataFromChain)(connection, programId, debug);
    try {
        const configResponse = await fetch(`https://api.solend.fi/v1/markets/configs?scope=all&deployment=${environment === "mainnet-beta" ? "production" : environment}`);
        if (!configResponse.ok) {
            // fallback
            throw Error("Solend backend configs failed.");
        }
        const configData = await configResponse.json();
        return configData.map((c) => ({
            name: (0, utils_1.titleCase)(c.name),
            owner: c.owner,
            address: c.address,
            authorityAddress: c.authorityAddress,
            reserves: c.reserves.map((r) => ({
                name: r.liquidityToken.name,
                logo: r.liquidityToken.logo,
                mintAddress: r.liquidityToken.mint,
                address: r.address,
            })),
        }));
    }
    catch (e) {
        return (0, exports.fetchPoolMetadataFromChain)(connection, programId, debug);
    }
}
exports.fetchPoolMetadata = fetchPoolMetadata;
const fetchPoolMetadataFromChain = async (connection, programId, debug) => {
    if (debug)
        console.log("fetchPoolsFromChain");
    const filters = [{ dataSize: state_1.LENDING_MARKET_SIZE }];
    const pools = Array.from(await connection.getProgramAccounts(programId, {
        commitment: connection.commitment,
        filters,
        encoding: "base64",
    }));
    return pools
        .sort((a, _b) => a.account.owner.toBase58() === constants_1.SOLEND_ADDRESSES[0] ? 1 : -1)
        .map((pool) => {
        const [authorityAddress, _bumpSeed] = web3_js_1.PublicKey.findProgramAddressSync([pool.pubkey.toBytes()], programId);
        return {
            name: null,
            owner: pool.account.owner.toBase58(),
            authorityAddress: authorityAddress.toBase58(),
            address: pool.pubkey.toBase58(),
            reserves: [],
        };
    });
};
exports.fetchPoolMetadataFromChain = fetchPoolMetadataFromChain;
