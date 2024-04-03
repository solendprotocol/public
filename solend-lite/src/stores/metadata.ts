import { DEBUG_MODE } from 'common/config';
import { getTokenInfosFromMetadata, TokenInfo, TokenMetadata } from '@solendprotocol/solend-sdk';
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
      const tokenInfoArray = await getTokenInfosFromMetadata(mints, connection, DEBUG_MODE)
      const tokenInfo = tokenInfoArray.reduce((acc, t) => {
        acc[t.address] = t;
        return acc;
      }, {} as Record<string, TokenInfo>);
      set(metadataAtom, tokenInfo);
    }
  },
);
