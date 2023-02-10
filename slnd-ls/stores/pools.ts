import { AccountInfo, Connection, PublicKey } from '@solana/web3.js';
import { atom, useAtom } from 'jotai';
import {
  atomFamily,
  atomWithDefault,
  selectAtom,
  splitAtom,
  waitForAll,
} from 'jotai/utils';
import { selectedObligationAtom } from './obligations';
import {
  fetchPools,
  getPoolsFromChain,
  getReservesFromChain,
  getReservesOfPool,
} from 'utils/pools';
import { publicKeyAtom } from './wallet';
import { selectedRpcAtom } from './settings';
import { createObligationAddress } from 'utils/common';
import { metadataAtom, TokenMetadata } from './metadata';
import SwitchboardProgram from '@switchboard-xyz/sbv2-lite';

export type ConfigType = {
  name: string | null;
  address: string;
};

export type ReserveType = Awaited<ReturnType<typeof getReservesOfPool>>[0];
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
  address: string;
  reserves: Array<ReserveType>;
};

export type SelectedPoolType =
  | PoolType
  | {
      address: string;
      reserves: Array<SelectedReserveType>;
    };

export const connectionAtom = atom<Connection>((get) => {
  const rpc = get(selectedRpcAtom);
  return new Connection(rpc.endpoint, 'confirmed');
});

async function fetchConfig(connection: Connection): Promise<Array<ConfigType>> {
  const configResponse = await fetch(
    `https://api.solend.fi/v1/markets/configs?scope=all&deployment=production`,
  );
  if (!configResponse.ok) {
    // fallback
    return await getPoolsFromChain(connection);
  }

  const configData = await configResponse.json();
  return configData.map((c: { name: string; address: string }) => ({
    name: c.name.charAt(0).toUpperCase().concat(c.name.slice(1)),
    address: c.address,
  }));
}

export const refreshCounterAtom = atom(0);

export const configAtom = atom(
  async (get) => {
    const connection = get(connectionAtom);
    return await fetchConfig(connection);
  },
  (_, set) => set(refreshCounterAtom, (i) => i + 1),
);

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
    const switchboardProgram = await SwitchboardProgram.loadMainnet(connection);

    set(
      poolsAtom,
      await fetchPools(
        config.map((pool) => pool.address),
        connection,
        switchboardProgram,
      ),
    );
  },
);

export const poolsFamily = atomFamily((address: string) =>
  atom(
    (get) => {
      return get(poolsAtom)[address];
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
    const switchboardProgram = await SwitchboardProgram.loadMainnet(connection);

    let metadata = get(metadataAtom);

    const poolToUpdateAtom = poolsFamily(newSelectedPoolAddress);
    if (!poolToUpdateAtom) {
      throw 'Selected pool not found';
    }

    const poolLoaded = Boolean(get(poolToUpdateAtom).reserves.length);

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
    ).then((updatedReserves) => {
      set(poolToUpdateAtom, {
        address: newSelectedPoolAddress,
        reserves: updatedReserves,
      });

      if (!poolLoaded && newSelectedObligationAddress) {
        set(selectedObligationAtom, {
          newSelectedObligationAddress,
          poolAddress: newSelectedPoolAddress,
        });
      }
    });

    if (poolLoaded && newSelectedObligationAddress) {
      set(selectedObligationAtom, {
        newSelectedObligationAddress,
        poolAddress: newSelectedPoolAddress,
      });
    }

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
