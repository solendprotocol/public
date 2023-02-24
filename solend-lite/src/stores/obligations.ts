import BigNumber from 'bignumber.js';
import { atom } from 'jotai';
import { atomFamily, loadable } from 'jotai/utils';
import { createObligationAddress } from 'utils/utils';
import {
  fetchObligationsByAddress,
  fetchObligationByAddress,
  formatObligation,
} from 'utils/obligations';
import { poolsAtom, poolsFamily } from './pools';
import { publicKeyAtom } from './wallet';
import { connectionAtom } from './settings';
import { configAtom } from './config';
import { PublicKey } from '@solana/web3.js';
import { Obligation } from '@solendprotocol/solend-sdk';

export type ObligationType = Awaited<ReturnType<typeof formatObligation>>;

export const rawObligationsAtom = atom<{
  [address: string]: RawObligationType;
}>({});

export const obligationsAtom = atom<Array<ObligationType>>((get) => {
  const pools = get(poolsAtom);
  return Object.values(get(rawObligationsAtom))
    .filter(
      (o) => o.info && pools[o.info.lendingMarket.toBase58()]?.reserves.length,
    )
    .map((o) => formatObligation(o, pools[o.info.lendingMarket.toBase58()]));
});

export type Position = {
  reserveAddress: string;
  amount: BigNumber;
};

export type RawObligationType = {
  pubkey: PublicKey;
  info: Obligation | null;
};

export const loadObligationsAtom = atom(
  (get) => get(rawObligationsAtom),
  async (get, set, fullLoad) => {
    const publicKey = get(publicKeyAtom);
    const connection = get(connectionAtom);
    const config = get(configAtom);

    const keys = await Promise.all(
      config.map((pool) => createObligationAddress(publicKey, pool.address)),
    );
    const obligations = fullLoad
      ? await fetchObligationsByAddress(keys, connection)
      : keys.map((o) => ({
          pubkey: new PublicKey(o),
          info: null,
        }));

    set(
      rawObligationsAtom,
      Object.fromEntries(
        obligations.map((obligation) => [
          obligation.pubkey.toBase58(),
          obligation,
        ]),
      ),
    );
  },
);

const obligationsFamily = atomFamily((address: string) =>
  atom(
    (get) => {
      const rawObligation = get(rawObligationsAtom)[address];
      if (!rawObligation?.info) return null;
      const pool = get(
        poolsFamily(rawObligation.info.lendingMarket.toBase58()),
      );
      if (!pool.reserves.length) return null;
      return formatObligation(rawObligation, pool);
    },
    (get, set, arg: RawObligationType) => {
      const prev = get(rawObligationsAtom);
      set(rawObligationsAtom, {
        ...prev,
        [address]: { ...prev[address], ...arg },
      });
    },
  ),
);

export const selectedObligationAddressAtom = atom<string | null>(null);

export const selectedObligationAtom = atom(
  (get) => {
    const selectedObligationAddress = get(selectedObligationAddressAtom);
    if (!selectedObligationAddress) return null;

    const obligation = get(obligationsFamily(selectedObligationAddress));
    if (!obligation) return null;

    return obligation;
  },
  (get, set, newSelectedObligationAddress: string) => {
    const connection = get(connectionAtom);

    const obligationToUpdateAtom = obligationsFamily(
      newSelectedObligationAddress,
    );
    if (!obligationToUpdateAtom) {
      throw Error('Selected obligation not found');
    }

    fetchObligationByAddress(newSelectedObligationAddress, connection).then(
      (ob) => {
        if (ob) {
          set(obligationToUpdateAtom, ob);
        }
      },
    );

    set(selectedObligationAddressAtom, newSelectedObligationAddress);
  },
);

export const loadableObligationAtom = loadable(selectedObligationAtom);
