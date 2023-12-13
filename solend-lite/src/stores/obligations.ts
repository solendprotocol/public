import BigNumber from 'bignumber.js';
import { atom } from 'jotai';
import { atomFamily, atomWithDefault, loadable } from 'jotai/utils';
import { poolsFamily, poolsWithMetaDataAtom, selectedPoolAtom } from './pools';
import { publicKeyAtom } from './wallet';
import { connectionAtom } from './settings';
import { configAtom } from './config';
import { PublicKey } from '@solana/web3.js';
import {
  createObligationAddress,
  fetchObligationByAddress,
  fetchObligationsByAddress,
  formatObligation,
  Obligation,
} from '@solendprotocol/solend-sdk';
import { DEBUG_MODE, PROGRAM_ID } from 'common/config';

export type ObligationType = Awaited<ReturnType<typeof formatObligation>>;

export const rawObligationsAtom = atom<{
  [address: string]: RawObligationType;
}>({});

export const obligationsAtom = atom<Array<ObligationType>>((get) => {
  const pools = get(poolsWithMetaDataAtom);
  return Object.values(get(rawObligationsAtom))
    .filter(
      (o) => o.info && pools[o.info.lendingMarket.toBase58()]?.reserves.length,
    )
    .map((o) =>
      o.info
        ? formatObligation(
            o as { pubkey: PublicKey; info: Obligation },
            pools[o.info.lendingMarket.toBase58()],
          )
        : null,
    )
    .filter(Boolean) as Array<ObligationType>;
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

    if (!publicKey) return;

    const keys = await Promise.all(
      config.map((pool) =>
        createObligationAddress(publicKey, pool.address, PROGRAM_ID),
      ),
    );
    const obligations = fullLoad
      ? await fetchObligationsByAddress(keys, connection, DEBUG_MODE)
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
      return formatObligation(
        rawObligation as { pubkey: PublicKey; info: Obligation },
        pool,
      );
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

export const selectedObligationAddressAtom = atomWithDefault<string | null>(
  () => {
    const queryParams = new URLSearchParams(window.location.search);
    const poolParam = queryParams.get('obligation');

    return poolParam;
  },
);

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
      throw new Error('Selected obligation not found');
    }

    fetchObligationByAddress(
      newSelectedObligationAddress,
      connection,
      DEBUG_MODE,
    ).then((ob) => {
      if (ob) {
        const selectedPool = get(selectedPoolAtom);
        if (ob.info.lendingMarket.toBase58() !== selectedPool?.address) {
          set(selectedPoolAtom, ob.info.lendingMarket.toBase58());
        }
        set(obligationToUpdateAtom, ob);
      }
    });

    set(selectedObligationAddressAtom, newSelectedObligationAddress);
  },
);

export const loadableObligationAtom = loadable(selectedObligationAtom);
