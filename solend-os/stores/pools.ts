import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import { atom, useAtom } from "jotai";
import { atomWithDefault, splitAtom } from "jotai/utils";
import { PROGRAM_ID, RPC_ENDPOINT } from "utils/config";
import { getPoolsFromChain, getReservesOfPool } from "utils/pools";
import { selectedObligationAtom } from "./obligations";
import { publicKeyAtom } from "./wallet";

export type ReserveType = {
    pubkey: PublicKey;
    account: AccountInfo<Buffer>;
}

export type PoolType = {
    address: PublicKey,
    reserves: Array<ReserveType>,
}

export const connectionAtom = atom<Connection>(
    new Connection(RPC_ENDPOINT.endpoint, "confirmed")
);

export const configAtom = atomWithDefault<Array<PublicKey>>(async (get) => {
    const connection = get(connectionAtom);
    return (await getPoolsFromChain(connection)).map(k => new PublicKey(k));
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

export const poolsAtom = atom<Array<PoolType>>([])

export const loadPoolsAtom = atom(
    (get) => get(poolsAtom),
    async (get, set) => {
        const connection = get(connectionAtom);
        const addresses = get(configAtom);
        const pools = await fetchPools(addresses, connection);
        console.log('pools', pools)
        return set(poolsAtom, pools);
    }
)

export const poolAtomsAtom = splitAtom(poolsAtom);

export const selectedPoolAddressAtom = atom<PublicKey | null>(null)

export const selectedPoolAtom = atom((get) => {
    const selectedPoolAddress = get(selectedPoolAddressAtom);
    const pools = get(poolsAtom);
    return pools.find(pool => selectedPoolAddress && pool.address.equals(selectedPoolAddress));
}, (get, set, newSelectedPoolAddress: PublicKey | null) => {
    if (!newSelectedPoolAddress) return;

    const poolAtoms = get(poolAtomsAtom);
    const connection = get(connectionAtom);
    const publicKey = get(publicKeyAtom);

    const selectedAtom = poolAtoms.find(poolAtom => get(poolAtom).address.equals(newSelectedPoolAddress));
    if (!selectedAtom) {
        throw 'Selected pool not found';
    }

    console.log('getReservesOfPool');
    getReservesOfPool(
        new PublicKey(newSelectedPoolAddress),
        connection
    ).then(updatedReserves => {
        set(selectedAtom, {
            address: newSelectedPoolAddress,
            reserves: updatedReserves
        })
    });

    if (publicKey) {
        PublicKey.createWithSeed(
            publicKey,
            newSelectedPoolAddress.toBase58().slice(0, 32),
            PROGRAM_ID
          ).then(newSelectedObligationAddress => {
            console.log('wtf', newSelectedObligationAddress.toBase58())
            set(selectedObligationAtom, newSelectedObligationAddress);
          })
    }

    set(selectedPoolAddressAtom, newSelectedPoolAddress);
});
