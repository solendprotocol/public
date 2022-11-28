import { GetProgramAccountsFilter, PublicKey } from "@solana/web3.js";
import { LENDING_MARKET_SIZE, MarketConfigType } from "@solendprotocol/solend-sdk";
import { CONNECTION, ENVIRONMENT, PROGRAM_ID } from "common/config";


const lendingMarketOwner = new PublicKey(
    "5pHk2TmnqQzRF9L6egy5FfiyBgS7G9cMZ5RFaJAvghzw"
);
// TODO: Get pools for all of the addresses below
const lendingMarketOwners = [
    new PublicKey("5pHk2TmnqQzRF9L6egy5FfiyBgS7G9cMZ5RFaJAvghzw"), // 30
    new PublicKey("yaDPAockQPna7Srx5LB2TugJSKHUduHghyZdQcn7zYz"),  // 25
    new PublicKey("81KTtWjRndxGQbJHGJq6EaJWL8JfXbyywVvZReVPQd1X"), // 84
    new PublicKey("GDmSxpPzLkfxxr6dHLNRnCoYVGzvgc41tozkrr4pHTjB"), // 2
];
const connection = CONNECTION;
const environment = ENVIRONMENT;
const programId = PROGRAM_ID;


export const getPools = async () => {
    const configResponse = await fetch(
        `https://api.solend.fi/v1/markets/configs?scope=all&deployment=${environment}`,
    );
    if (!configResponse.ok) {
        // fallback
        const pools = await getPoolsFromChain();
        const poolList = pools.map((pool) => {
            const Pool: PoolViewModel = {
                address: pool.pubkey.toBase58(),
            };
            return Pool;
        });
        return poolList;
    }

    const configData = await configResponse.json();
    const pools = configData.map(getPoolViewModel);
    return pools;
};


const getPoolsFromChain = async () => {
    const filters: GetProgramAccountsFilter[] = [
        { dataSize: LENDING_MARKET_SIZE },
        { memcmp: { offset: 2, bytes: lendingMarketOwner.toBase58() } },
    ];

    const pools = await connection.getProgramAccounts(programId, {
        commitment: connection.commitment,
        filters,
        encoding: "base64",
    });
    return pools;
};


const getPoolViewModel = (lendingMarket: MarketConfigType): PoolViewModel => {
    const PoolViewModel: PoolViewModel = {
        name: lendingMarket.name,
        address: lendingMarket.address,
    }
    return PoolViewModel;
};
