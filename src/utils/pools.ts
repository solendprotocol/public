import { GetProgramAccountsFilter, PublicKey } from "@solana/web3.js";
import { LENDING_MARKET_SIZE, MarketConfigType } from "@solendprotocol/solend-sdk";
import { CONNECTION, ENVIRONMENT, PROGRAM_ID } from "common/config";
import { PoolViewModel } from "models/Pools";


const lendingMarketOwner = new PublicKey(
    "5pHk2TmnqQzRF9L6egy5FfiyBgS7G9cMZ5RFaJAvghzw"
);
const connection = CONNECTION;
const environment = ENVIRONMENT;
const programId = PROGRAM_ID;


export async function getPools(): Promise<PoolViewModel[]> {
    const configResponse = await fetch(
        `https://api.solend.fi/v1/markets?scope=all&deployment=${environment}`,
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
    const pools = configData.results.map(getPoolViewModel);
    return pools;
}

async function getPoolsFromChain() {
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
}

function getPoolViewModel(lendingMarket: MarketConfigType): PoolViewModel {
    const PoolViewModel: PoolViewModel = {
        name: lendingMarket.name,
        address: lendingMarket.address,
    }
    return PoolViewModel;
}