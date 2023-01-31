import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import { atom, useAtom } from "jotai";
import { atomFamily, atomWithDefault, selectAtom, splitAtom, waitForAll } from "jotai/utils";
import { PROGRAM_ID } from "utils/config";
import { selectedObligationAtom } from "./obligations";
import { getPoolsFromChain, getReservesFromChain, getReservesOfPool } from "utils/pools";
import { publicKeyAtom } from "./wallet";
import { selectedRpcAtom } from "./settings";
import { createObligationAddress } from "utils/common";
import BigNumber from "bignumber.js";
import { metadataAtom } from "./metadata";
import SwitchboardProgram from "@switchboard-xyz/sbv2-lite";

export type ConfigType = {
    name: string | null;
    address: string;
}

export type ReserveType = {
    address: string;
    mintAddress: string;
    poolAddress: string;
    pythOracle: string,
    decimals: number,
    price: BigNumber,
    totalSupply: BigNumber,
    totalBorrow: BigNumber,
    supplyInterest: BigNumber,
    borrowInterest: BigNumber,
    switchboardOracle: string,
    loanToValueRatio: number,
}

export type SelectedReserveType = ReserveType & {
    symbol: string,
}

export type PoolType = {
    address: string,
    reserves: Array<ReserveType>,
}

export type SelectedPoolType = PoolType | {
    address: string,
    reserves: Array<SelectedReserveType>,
}

export const connectionAtom = atom<Connection>((get) => {
    const rpc = get(selectedRpcAtom);
    return new Connection(rpc.endpoint, "confirmed");
    }
);

export const switchboardProgramAtom = atomWithDefault(async (get) => {
    const connection = get(connectionAtom);
    return await SwitchboardProgram.loadMainnet(connection);
  });

async function fetchConfig(connection: Connection) {
    return await getPoolsFromChain(connection);
}

export const configAtom = atomWithDefault(async (get) => {
    const connection = get(connectionAtom);
    return await fetchConfig(connection);
});

async function fetchPools(poolAddressAddresses: Array<string>, connection: Connection, switchboardProgram: SwitchboardProgram) {
    const reserves = await getReservesFromChain(connection, switchboardProgram);

    let pools = Object.fromEntries(poolAddressAddresses.map((address) => [address, {
        address,
        reserves: [] as Array<ReserveType>
    }]));

    reserves.filter(reserve => poolAddressAddresses.includes(reserve.poolAddress)).forEach(reserve => {
        pools[reserve.poolAddress].reserves.push(reserve);
    }, []);

    return pools;
}

export const poolsStateAtom = atom<'initial' | 'loading' | 'error' | 'done'>((get) => 
    Object.values(get(poolsAtom)).reduce((acc, p) => p.reserves.length + acc, 0) === 0 ? 'loading' : 'done'
);

export const poolsAtom = atomWithDefault<{[address: string]: PoolType}>(async (get) => {
    const config = get(configAtom);
    const _switchboardProgram = get(switchboardProgramAtom);

    return Object.fromEntries(config.map(pool => [pool.address, {
        address: pool.address,
        reserves: []
    }]));
})

export const loadPoolsAtom = atom(
    (get) => {get(poolsAtom)},
    async (get, set) => {
        const [connection, config, switchboardProgram] = get(waitForAll([connectionAtom, configAtom, switchboardProgramAtom]));

        set(poolsAtom, await fetchPools(config.map(pool => pool.address), connection, switchboardProgram));
    }
)

export const poolsFamily = atomFamily((address: string) =>
  atom(
    (get) => {
        return get(poolsAtom)[address];
    },
    (get, set, arg: PoolType) => {
      const prev = get(poolsAtom)
      set(poolsAtom, { ...prev, [address]: { ...prev[address], ...arg } })
    }, 
  ),
)

export const reserveToMintMapAtom = atom((get) => {
    const pools = get(poolsAtom);

    return Object.fromEntries(
        Object.values(pools).flatMap(pool => pool.reserves).map(r => [r.address, r.mintAddress])
    );
})

export const selectedPoolAddressAtom = atomWithDefault<string | null>((get) => {
    const config = get(configAtom);
    return config[0].address;
})

export const selectedPoolAtom = atom((get) => {
    const selectedPoolAddress = get(selectedPoolAddressAtom);
    if (!selectedPoolAddress) return null;

    const metadata = get(metadataAtom);
    const selectedPool = get(poolsFamily(selectedPoolAddress));

    return {
        ...selectedPool,
        reserves: selectedPool.reserves.map(r => {
            const addressString = r.mintAddress;
            const tokenMetadata = metadata[addressString];

            return {
                ...r,
                symbol: tokenMetadata?.symbol,
                logo: tokenMetadata?.logoUri,
            }
        })
    }
}, async (get, set, newSelectedPoolAddress: string | null) => {
    if (!newSelectedPoolAddress) return;
    const [connection, publicKey, switchboardProgram] = get(waitForAll([connectionAtom, publicKeyAtom, switchboardProgramAtom]));

    const poolToUpdateAtom = poolsFamily(newSelectedPoolAddress);
    if (!poolToUpdateAtom) {
        throw 'Selected pool not found';
    }

    const poolLoaded = Boolean(get(poolToUpdateAtom).reserves.length);

    let newSelectedObligationAddress: string | null = null;
    if (publicKey) {
        newSelectedObligationAddress = (await createObligationAddress(publicKey, newSelectedPoolAddress))
    }

    getReservesOfPool(
        new PublicKey(newSelectedPoolAddress),
        connection,
        switchboardProgram
    ).then(updatedReserves => {
        set(poolToUpdateAtom, {
            address: newSelectedPoolAddress,
            reserves: updatedReserves
        })

        if (!poolLoaded && newSelectedObligationAddress) {
            set(selectedObligationAtom, {
                newSelectedObligationAddress,
                poolAddress: newSelectedPoolAddress
            });
        }
    });


    if (poolLoaded && newSelectedObligationAddress) {
        set(selectedObligationAtom, {
            newSelectedObligationAddress,
            poolAddress: newSelectedPoolAddress
        });
    }

    set(selectedPoolAddressAtom, newSelectedPoolAddress);
});


export const selectedPoolStateAtom = atom<'initial' | 'loading' | 'error' | 'done'>((get) => 
    (get(selectedPoolAtom)?.reserves?.length ?? 0) === 0 ? 'loading' : 'done'
);
export const unqiueAssetsAtom = selectAtom(
    poolsAtom,
    pools => {
        const assets = Object.values(pools).flatMap(p => p.reserves.map(r => r.mintAddress))
        return assets.filter((item, pos) => assets.indexOf(item) === pos);
    },
    (a, b) => {
        const sortB = b.sort()
        return Boolean(a.length) && a.sort().every((val, index) => val === sortB[index]);
    }
);