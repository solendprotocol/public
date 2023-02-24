import { PublicKey } from '@solana/web3.js';
import { atom } from 'jotai';
import {
  atomFamily,
  atomWithDefault,
  selectAtom,
  waitForAll,
} from 'jotai/utils';
import { fetchPools, formatReserve, getReservesOfPool } from 'utils/pools';
import { publicKeyAtom } from './wallet';
import { connectionAtom, switchboardAtom } from './settings';
import { createObligationAddress } from 'utils/utils';
import { metadataAtom } from './metadata';
import { selectedObligationAtom } from './obligations';
import { configAtom } from './config';
import BigNumber from 'bignumber.js';

export type ReserveType = Awaited<ReturnType<typeof formatReserve>>;
export type ReserveWithMetadataType = Awaited<
  ReturnType<typeof getReservesOfPool>
>[0] & {
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
          address: pool.address,
          reserves: [],
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
    const [connection, config] = get(waitForAll([connectionAtom, configAtom]));
    const switchboardProgram = get(switchboardAtom);

    set(poolsAtom, await fetchPools(config, connection, switchboardProgram));
  },
);

export const poolsFamily = atomFamily((address: string) =>
  atom(
    (get) => {
      return get(poolsWithMetaData)[address];
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

export const poolsWithMetaData = atom((get) => {
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

export const selectedReserveAtom = atom(
  (get) => {
    const pool = get(selectedPoolAtom);
    const selectedReserveAddress = get(selectedReserveAddressAtom);
    const reserve = pool?.reserves?.find(
      (r) => r.address === selectedReserveAddress,
    );
    return reserve;
  },
  (_get, set, newSelectedPoolAddress: string | null) => {
    set(selectedReserveAddressAtom, newSelectedPoolAddress);
  },
);

export const selectedPoolAtom = atom(
  (get) => {
    const selectedPoolAddress = get(selectedPoolAddressAtom);
    if (!selectedPoolAddress) return null;
    const metadata = get(metadataAtom);
    const selectedPool = get(poolsFamily(selectedPoolAddress));

    console.log('preloaded3');
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

    console.log('preloaded1');
    const poolToUpdateAtom = poolsFamily(newSelectedPoolAddress);
    if (!poolToUpdateAtom) {
      throw Error('Selected pool not found');
    }

    let newSelectedObligationAddress: string | null = null;
    if (publicKey) {
      newSelectedObligationAddress = await createObligationAddress(
        publicKey,
        newSelectedPoolAddress,
      );
    }

    getReservesOfPool(
      new PublicKey(newSelectedPoolAddress),
      connection,
      switchboardProgram,
    );
    console.log('preloaded2');

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
