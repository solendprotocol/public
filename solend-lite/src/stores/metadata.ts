import { DEBUG_MODE } from 'common/config';
import { fetchTokensInfo, TokenMetadata } from '@solendprotocol/solend-sdk';
import { atom } from 'jotai';
import { unqiueAssetsAtom } from './pools';
import { connectionAtom } from './settings';

export const metadataAtom = atom<TokenMetadata>({});

export const loadMetadataAtom = atom(
  (get) => {
    get(metadataAtom);
  },
  async (get, set) => {
    const mints = get(unqiueAssetsAtom);
    const connection = get(connectionAtom);

    if (mints.length) {
      set(metadataAtom, await fetchTokensInfo(mints, connection, DEBUG_MODE));
    }
  },
);
