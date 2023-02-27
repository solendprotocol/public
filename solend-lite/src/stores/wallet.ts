import {
  createObligationAddress,
  fetchWalletAssets,
  formatWalletAssets,
} from '@solendprotocol/solend-sdk';
import { PROGRAM_ID } from 'common/config';
import { atom } from 'jotai';
import { metadataAtom } from './metadata';
import {
  loadObligationsAtom,
  rawObligationsAtom,
  selectedObligationAtom,
} from './obligations';
import {
  selectedPoolAddressAtom,
  selectedPoolAtom,
  unqiueAssetsAtom,
} from './pools';
import { connectionAtom } from './settings';
import { atomWithRefresh } from './shared';

export const publicKeyAtom = atom<string | null>(null);

export const setPublicKeyAtom = atom(
  (get) => get(publicKeyAtom),
  async (get, set, newPublicKey: string | null) => {
    const selectedPoolAddress = get(selectedPoolAddressAtom);
    set(publicKeyAtom, newPublicKey);

    if (!newPublicKey) {
      set(rawObligationsAtom, {});
      set(selectedPoolAtom, null);
      return;
    }

    await set(loadObligationsAtom, false);
    if (selectedPoolAddress) {
      set(
        selectedObligationAtom,
        await createObligationAddress(
          newPublicKey,
          selectedPoolAddress,
          PROGRAM_ID,
        ),
      );
    }
    set(loadObligationsAtom, true);
  },
);

export const rawWalletDataAtom = atomWithRefresh(async (get) => {
  const uniqueAssets = get(unqiueAssetsAtom);
  const publicKey = get(publicKeyAtom);
  const connection = get(connectionAtom);
  if (!publicKey) return null;

  return fetchWalletAssets(uniqueAssets, publicKey, connection);
});

export const walletAssetsAtom = atomWithRefresh(async (get) => {
  const rawWalletData = get(rawWalletDataAtom);
  const metadata = get(metadataAtom);

  return rawWalletData ? formatWalletAssets(rawWalletData, metadata) : [];
});
