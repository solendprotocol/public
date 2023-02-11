import { atom } from 'jotai';
import { atomWithDefault } from 'jotai/utils';
import { getTokensInfo } from 'utils/metadata';
import {
  connectionAtom,
  selectedPoolAddressAtom,
  selectedPoolAtom,
  unqiueAssetsAtom,
} from './pools';

export type TokenMetadata = {
  [mintAddress: string]: {
    symbol: string;
    logoUri: string | null;
    decimals: number;
  };
};

export const metadataAtom = atom<TokenMetadata>({});

export const loadMetadataAtom = atom(
  (get) => {
    get(metadataAtom);
  },
  async (get, set) => {
    const mints = get(unqiueAssetsAtom);
    const connection = get(connectionAtom);

    if (mints.length) {
      set(metadataAtom, await getTokensInfo(mints));
    }
  },
);
