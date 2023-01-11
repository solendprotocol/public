import { PublicKey } from "@solana/web3.js";
import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
import { PROGRAM_ID } from "utils/config";
import { fetchSimulatedObligationByAddress, fetchObligationsByAddress, ObligationType, fetchObligationByAddress } from "utils/obligations";
import { configAtom, connectionAtom, poolsAtom, poolsFamily } from "./pools";
import { publicKeyAtom } from "./wallet";

export const obligationsAtom = atom<{[address: string]: ObligationType}>({});

export const loadObligationsAtom = atom(
    (get) => get(obligationsAtom),
    async (get, set, fullLoad) => {
        const publicKey = get(publicKeyAtom);
        const connection = get(connectionAtom);
        const config = get(configAtom);

        if (!publicKey || !config.length) return;

        const keys = await Promise.all(
            config.map(address => PublicKey.createWithSeed(
            publicKey,
            address.toBase58().slice(0, 32),
            PROGRAM_ID
        )))

        const obligations = fullLoad ? await fetchObligationsByAddress(keys, connection) : keys.map((o, index) => ({
            address: o,
            poolAddress: config[index],
            deposits: [],
            borrows: [],
        }));

        set(
            obligationsAtom, 
            Object.fromEntries(
                obligations.map(
                    obligation => [
                        obligation.address.toBase58(), 
                        obligation
                    ]
                )
            )
        );
    }
)


const obligationsFamily = atomFamily((address: string) =>
  atom(
    (get) => {
        return get(obligationsAtom)[address];
    },
    (get, set, arg: ObligationType) => {
      const prev = get(obligationsAtom)
      set(obligationsAtom, { ...prev, [address]: { ...prev[address], ...arg } })
    }, 
  ),
)

export const selectedObligationAddressAtom = atom<PublicKey | null>(null)

export const selectedObligationAtom = atom((get) => {
    const selectedObligationAddress = get(selectedObligationAddressAtom);
    return selectedObligationAddress ? get(obligationsFamily(selectedObligationAddress.toBase58())) : null;
}, (get, set, payload: {
        newSelectedObligationAddress: PublicKey | null,
        lendingMarket?: PublicKey,
    }) => {
    if (!payload.newSelectedObligationAddress) return;

    const connection = get(connectionAtom);

    const obligationToUpdateAtom = obligationsFamily(payload.newSelectedObligationAddress.toBase58());
    if (!obligationToUpdateAtom) {
        throw 'Selected obligation not found';
    }

    const obligation = get(obligationToUpdateAtom);
    const poolAddress = payload.lendingMarket?.toBase58() ?? obligation.poolAddress.toBase58();

    if (!poolAddress) {
        throw Error('Pool address for obligation must be specified to simulate transaction.')
    }

    const pool = get(poolsFamily(
        poolAddress
    ));

    if (pool.reserves.length) {
        fetchSimulatedObligationByAddress(payload.newSelectedObligationAddress, connection, pool).then(
            obligation => {
                if (obligation) {
                    set(obligationToUpdateAtom, obligation)
                }
            }
        )
    } else {
        fetchObligationByAddress(payload.newSelectedObligationAddress, connection).then(
            obligation => {
                if (obligation) {
                    set(obligationToUpdateAtom, obligation)
                }
            }
        )
    }

    set(selectedObligationAddressAtom, payload.newSelectedObligationAddress);
});
