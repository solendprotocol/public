import { PublicKey } from '@solana/web3.js';
import { atom } from 'jotai';
import {
  atomFamily,
  atomWithDefault,
  selectAtom,
  waitForAll,
} from 'jotai/utils';
import { publicKeyAtom } from './wallet';
import { connectionAtom, switchboardAtom } from './settings';
import { metadataAtom } from './metadata';
import { selectedObligationAtom } from './obligations';
import { configAtom } from './config';
import BigNumber from 'bignumber.js';
import {
  createObligationAddress,
  ReserveType,
  fetchPools,
  getReservesOfPool,
} from '@solendprotocol/solend-sdk';
import { DEBUG_MODE, PROGRAM_ID } from 'common/config';

export type ReserveWithMetadataType = ReserveType & {
  symbol: string;
  logo: string | null;
};

export type SelectedReserveType = ReserveType & {
  symbol: string;
  logo: string | null;
};

export type PoolType = {
  name: string | null;
  address: string;
  authorityAddress: string;
  reserves: Array<ReserveType>;
};

export type SelectedPoolType = {
  name: string | null;
  address: string;
  reserves: Array<SelectedReserveType>;
};

export const poolsStateAtom = atom<'initial' | 'loading' | 'error' | 'done'>(
  (get) =>
    Object.values(get(poolsAtom)).reduce(
      (acc, p) => p.reserves.length + acc,
      0,
    ) === 0
      ? 'loading'
      : 'done',
);

export const poolsAtom = atomWithDefault<{ [address: string]: PoolType }>(
  async (get) => {
    const config = get(configAtom);

    return Object.fromEntries(
      config.map((pool) => [
        pool.address,
        {
          name: pool.name,
          authorityAddress: pool.authorityAddress,
          address: pool.address,
          reserves: [] as Array<ReserveType>,
        },
      ]),
    );
  },
);

export const loadPoolsAtom = atom(
  (get) => {
    get(poolsAtom);
  },
  async (get, set) => {
    const [connection, pools] = get(waitForAll([connectionAtom, poolsAtom]));
    const switchboardProgram = get(switchboardAtom);

    set(
      poolsAtom,
      await fetchPools(
        Object.values(pools),
        connection,
        switchboardProgram,
        PROGRAM_ID,
        DEBUG_MODE,
      ),
    );
  },
);

export const poolsFamily = atomFamily((address: string) =>
  atom(
    (get) => {
      return get(poolsWithMetaDataAtom)[address];
    },
    (get, set, arg: PoolType) => {
      const prev = get(poolsAtom);
      set(poolsAtom, { ...prev, [address]: { ...prev[address], ...arg } });
    },
  ),
);

export const reserveToMintMapAtom = atom((get) => {
  const pools = get(poolsAtom);

  return Object.fromEntries(
    Object.values(pools)
      .flatMap((pool) => pool.reserves)
      .map((r) => [r.address, r.mintAddress]),
  );
});

export const poolsWithMetaDataAtom = atom((get) => {
  const metadata = get(metadataAtom);
  const pools = get(poolsAtom);

  return Object.fromEntries(
    Object.values(pools).map((p) => [
      p.address,
      {
        ...p,
        totalSupplyUsd: p.reserves.reduce(
          (acc, r) => r.totalSupplyUsd.plus(acc),
          BigNumber(0),
        ),
        reserves: p.reserves.map((r) => ({
          ...r,
          symbol: metadata[r.mintAddress]?.symbol,
          logo: metadata[r.mintAddress]?.logoUri,
        })),
      },
    ]),
  );
});

export const selectedPoolAddressAtom = atomWithDefault<string | null>((get) => {
  const config = get(configAtom);
  return config[0].address;
});

export const selectedReserveAddressAtom = atom<string | null>(null);

export const selectedPoolAtom = atom(
  (get) => {
    const selectedPoolAddress = get(selectedPoolAddressAtom);
    if (!selectedPoolAddress) return null;
    const metadata = get(metadataAtom);
    const selectedPool = get(poolsFamily(selectedPoolAddress));
    return {
      ...selectedPool,
      reserves: selectedPool.reserves.map((r) => {
        const addressString = r.mintAddress;
        const tokenMetadata = metadata[addressString];

        return {
          ...r,
          symbol: tokenMetadata?.symbol,
          logo: tokenMetadata?.logoUri,
        };
      }),
    };
  },
  async (get, set, newSelectedPoolAddress: string | null) => {
    if (!newSelectedPoolAddress) return;
    const [connection, publicKey] = get(
      waitForAll([connectionAtom, publicKeyAtom]),
    );
    const switchboardProgram = get(switchboardAtom);
    const poolToUpdateAtom = poolsFamily(newSelectedPoolAddress);
    if (!poolToUpdateAtom) {
      throw Error('Selected pool not found');
    }

    let newSelectedObligationAddress: string | null = null;
    if (publicKey) {
      newSelectedObligationAddress = await createObligationAddress(
        publicKey,
        newSelectedPoolAddress,
        PROGRAM_ID,
      );
    }

    getReservesOfPool(
      new PublicKey(newSelectedPoolAddress),
      connection,
      switchboardProgram,
      PROGRAM_ID,
      DEBUG_MODE,
    );

    if (newSelectedObligationAddress) {
      set(selectedObligationAtom, newSelectedObligationAddress);
    }

    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('pool', newSelectedPoolAddress);
    const newurl =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      '?' +
      searchParams.toString();
    window.history.pushState({ path: newurl }, '', newurl);
    set(selectedPoolAddressAtom, newSelectedPoolAddress);
  },
);

export const selectedPoolStateAtom = atom<
  'initial' | 'loading' | 'error' | 'done'
>((get) =>
  (get(selectedPoolAtom)?.reserves?.length ?? 0) === 0 ? 'loading' : 'done',
);

export const unqiueAssetsAtom = selectAtom(
  poolsAtom,
  (pools) => {
    const assets = Object.values(pools).flatMap((p) =>
      p.reserves.map((r) => r.mintAddress),
    );
    return assets.filter((item, pos) => assets.indexOf(item) === pos);
  },
  (a, b) => {
    const sortB = b.sort();
    return (
      Boolean(a.length) && a.sort().every((val, index) => val === sortB[index])
    );
  },
);
