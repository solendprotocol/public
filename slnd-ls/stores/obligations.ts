import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { atom } from 'jotai';
import { atomFamily, loadable } from 'jotai/utils';
import { createObligationAddress } from 'utils/common';
import {
  fetchSimulatedObligationByAddress,
  fetchObligationsByAddress,
  fetchObligationByAddress,
} from 'utils/obligations';
import { metadataAtom } from './metadata';
import {
  configAtom,
  connectionAtom,
  poolsFamily,
  selectedPoolAtom,
} from './pools';
import { publicKeyAtom } from './wallet';

export const obligationsAtom = atom<{ [address: string]: ObligationType }>({});

export type Position = {
  reserveAddress: string;
  amount: BigNumber;
};

export type ObligationType = {
  address: string;
  deposits: Array<Position>;
  borrows: Array<Position>;
  poolAddress: string;
  totalSupplyValue: BigNumber;
  totalBorrowValue: BigNumber;
  borrowLimit: BigNumber;
  liquidationThreshold: BigNumber;
  netAccountValue: BigNumber;
  liquidationThresholdFactor: BigNumber;
  borrowLimitFactor: BigNumber;
  borrowUtilization: BigNumber;
  isBorrowLimitReached: boolean;
  borrowOverSupply: BigNumber;
  borrowLimitOverSupply: BigNumber;
};

export const loadObligationsAtom = atom(
  (get) => get(obligationsAtom),
  async (get, set, fullLoad) => {
    const publicKey = get(publicKeyAtom);
    const connection = get(connectionAtom);
    const config = get(configAtom);

    if (!publicKey || !config.length) return;

    const keys = await Promise.all(
      config.map((pool) => createObligationAddress(publicKey, pool.address)),
    );
    const obligations = fullLoad
      ? await fetchObligationsByAddress(keys, connection)
      : keys.map((o, index) => ({
          address: o,
          deposits: [],
          borrows: [],
          poolAddress: config[index].address,
          totalSupplyValue: new BigNumber(0),
          totalBorrowValue: new BigNumber(0),
          borrowLimit: new BigNumber(0),
          liquidationThreshold: new BigNumber(0),
          netAccountValue: new BigNumber(0),
          liquidationThresholdFactor: new BigNumber(0),
          borrowLimitFactor: new BigNumber(0),
          borrowUtilization: new BigNumber(0),
          isBorrowLimitReached: false,
          borrowOverSupply: new BigNumber(0),
          borrowLimitOverSupply: new BigNumber(0),
        }));

    set(
      obligationsAtom,
      Object.fromEntries(
        obligations.map((obligation) => [obligation.address, obligation]),
      ),
    );
  },
);

const obligationsFamily = atomFamily((address: string) =>
  atom(
    (get) => {
      return get(obligationsAtom)[address];
    },
    (get, set, arg: ObligationType) => {
      const prev = get(obligationsAtom);
      set(obligationsAtom, {
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
    const metadata = get(metadataAtom);
    const selectedPool = get(selectedPoolAtom);
    const obligation = get(obligationsFamily(selectedObligationAddress));

    if (!obligation) return null;
    return selectedObligationAddress
      ? {
          ...obligation,
          deposits:
            obligation?.deposits?.map((d) => {
              const reserve = selectedPool?.reserves.find(
                (r) => r.address === d.reserveAddress,
              );

              const addressString = reserve?.mintAddress;
              const tokenMetadata = metadata[addressString ?? ''];

              const decimals = reserve?.decimals ?? 0;

              return {
                ...d,
                decimals,
                amount: d.amount.shiftedBy(-decimals),
                price: reserve?.price,
                amountUsd: d.amount
                  .shiftedBy(-decimals)
                  .times(reserve?.price ?? 0),
                symbol: tokenMetadata?.symbol,
                logo: tokenMetadata?.logoUri,
              };
            }) ?? [],
          borrows:
            obligation?.borrows?.map((b) => {
              const reserve = selectedPool?.reserves.find(
                (r) => r.address === b.reserveAddress,
              );

              const addressString = reserve?.mintAddress;
              const tokenMetadata = metadata[addressString ?? ''];

              const decimals = reserve?.decimals ?? 0;

              return {
                ...b,
                decimals,
                amount: b.amount.shiftedBy(-(decimals + 18)),
                price: reserve?.price,
                amountUsd: b.amount
                  .shiftedBy(-(decimals + 18))
                  .times(reserve?.price ?? 0),
                symbol: tokenMetadata?.symbol,
                logo: tokenMetadata?.logoUri,
              };
            }) ?? [],
        }
      : null;
  },
  (
    get,
    set,
    payload: {
      newSelectedObligationAddress: string | null;
      poolAddress?: string;
    },
  ) => {
    if (!payload.newSelectedObligationAddress) return;

    const connection = get(connectionAtom);

    const obligationToUpdateAtom = obligationsFamily(
      payload.newSelectedObligationAddress,
    );
    if (!obligationToUpdateAtom) {
      throw 'Selected obligation not found';
    }

    const obligation = get(obligationToUpdateAtom);
    const poolAddress = payload.poolAddress ?? obligation.poolAddress;

    if (!poolAddress) {
      throw Error(
        'Pool address for obligation must be specified to simulate transaction.',
      );
    }

    const pool = get(poolsFamily(poolAddress));

    if (pool.reserves.length) {
      fetchSimulatedObligationByAddress(
        payload.newSelectedObligationAddress,
        connection,
        pool,
      ).then((obligation) => {
        if (obligation) {
          set(obligationToUpdateAtom, obligation);
        }
      });
    } else {
      fetchObligationByAddress(
        payload.newSelectedObligationAddress,
        connection,
      ).then((obligation) => {
        if (obligation) {
          set(obligationToUpdateAtom, obligation);
        }
      });
    }

    set(selectedObligationAddressAtom, payload.newSelectedObligationAddress);
  },
);

export const loadableObligationAtom = loadable(selectedObligationAtom);
