import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import { atom, useAtom } from "jotai";
import { atomFamily, atomWithDefault, splitAtom } from "jotai/utils";
import { PROGRAM_ID, RPC_ENDPOINT } from "utils/config";
import { selectedObligationAtom } from "./obligations";
import { getPoolsFromChain, getReservesOfPool } from "utils/pools";
import { publicKeyAtom } from "./wallet";

export type ReserveType = {
    address: PublicKey;
    mintAddress: PublicKey;
    poolAddress: PublicKey;
    pythOracle: PublicKey,
    switchboardOracle: PublicKey,
}

export type PoolType = {
    address: PublicKey,
    reserves: Array<ReserveType>,
}

export const connectionAtom = atom<Connection>(
    new Connection(RPC_ENDPOINT.endpoint, "confirmed")
);

async function fetchConfig(connection: Connection) {
    return (await getPoolsFromChain(connection)).map(k => new PublicKey(k));
}

export const configAtom = atomWithDefault(async (get) => {
    const connection = get(connectionAtom);
    return fetchConfig(connection);
});

async function fetchPools(addresses: Array<PublicKey>, connection: Connection) {
    return Promise.all(addresses.map(
        (address) => getReservesOfPool(
            new PublicKey(address),
            connection
        ).then(reserves => ({
            address: new PublicKey(address),
            reserves,
        }))
    ));
}

export const poolsAtom = atomWithDefault<{[address: string]: PoolType}>(async (get) => {
    const config = get(configAtom);
    return Object.fromEntries(config.map(address => [address, {
        address,
        reserves: []
    }]));
})

export const loadPoolsAtom = atom(
    (get) => {get(poolsAtom)},
    async (get, set) => {
        const connection = get(connectionAtom);
        const addresses = get(configAtom);

        set(poolsAtom, await fetchPools(addresses, connection).then(pools => Object.fromEntries(pools.map(pool => [pool.address, pool]))));
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

export const selectedPoolAddressAtom = atomWithDefault<PublicKey | null>((get) => {
    const config = get(configAtom);
    return config[0];
})

export const selectedPoolAtom = atom((get) => {
    const selectedPoolAddress = get(selectedPoolAddressAtom);
    return selectedPoolAddress ? get(poolsFamily(selectedPoolAddress.toBase58())) : null;
}, async (get, set, newSelectedPoolAddress: PublicKey | null) => {
    if (!newSelectedPoolAddress) return;

    const connection = get(connectionAtom);
    const publicKey = get(publicKeyAtom);

    const poolToUpdateAtom = poolsFamily(newSelectedPoolAddress.toBase58());
    if (!poolToUpdateAtom) {
        throw 'Selected pool not found';
    }

    const poolLoaded = Boolean(get(poolToUpdateAtom).reserves.length);

    let newSelectedObligationAddress: PublicKey | null = null;
    if (publicKey) {
        newSelectedObligationAddress = await PublicKey.createWithSeed(
            publicKey,
            newSelectedPoolAddress.toBase58().slice(0, 32),
            PROGRAM_ID
          )
    }

    getReservesOfPool(
        new PublicKey(newSelectedPoolAddress),
        connection
    ).then(updatedReserves => {
        set(poolToUpdateAtom, {
            address: newSelectedPoolAddress,
            reserves: updatedReserves
        })

        if (!poolLoaded && newSelectedObligationAddress) {
            set(selectedObligationAtom, {
                newSelectedObligationAddress,
                lendingMarket: newSelectedPoolAddress
            });
        }
    });


    if (poolLoaded && newSelectedObligationAddress) {
        set(selectedObligationAtom, {
            newSelectedObligationAddress,
            lendingMarket: newSelectedPoolAddress
        });
    }

    set(selectedPoolAddressAtom, newSelectedPoolAddress);
});

export const unqiueAssetsAtom = atom((get) => {
    const pools = get(poolsAtom)

    const assets = Object.values(pools).flatMap(p => p.reserves.map(r => r.mintAddress));
    const unqiueAssets = assets.filter((item, pos) => assets.indexOf(item) === pos);

    return unqiueAssets
});