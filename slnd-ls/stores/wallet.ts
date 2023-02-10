import {
  unpackAccount,
  getAssociatedTokenAddress,
  NATIVE_MINT,
} from '@solana/spl-token';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { atom } from 'jotai';
import {
  createObligationAddress,
  getBatchMultipleAccountsInfo,
} from 'utils/common';
import { metadataAtom } from './metadata';
import {
  loadObligationsAtom,
  obligationsAtom,
  selectedObligationAtom,
} from './obligations';
import {
  connectionAtom,
  selectedPoolAddressAtom,
  selectedPoolAtom,
  unqiueAssetsAtom,
} from './pools';

type WalletAssetType = {
  amount: BigNumber;
  mintAddress: string;
  symbol: string;
  decimals: number;
  address: string;
};

export type WalletType = Array<WalletAssetType>;

export const publicKeyAtom = atom<string | null>(null);

export const setPublicKeyAtom = atom(
  (get) => get(publicKeyAtom),
  async (get, set, newPublicKey: string | null) => {
    const selectedPoolAddress = get(selectedPoolAddressAtom);
    set(publicKeyAtom, newPublicKey);
    if (!newPublicKey) {
      set(obligationsAtom, {});
      set(selectedPoolAtom, null);
      return;
    }

    await set(loadObligationsAtom, false);
    if (selectedPoolAddress) {
      set(selectedObligationAtom, {
        newSelectedObligationAddress: await createObligationAddress(
          newPublicKey,
          selectedPoolAddress,
        ),
        poolAddress: selectedPoolAddress,
      });
    }
    set(loadObligationsAtom, true);
  },
);

export const walletAssetsAtom = atom(async (get) => {
  const uniqueAssets = get(unqiueAssetsAtom);
  const publicKey = get(publicKeyAtom);
  const connection = get(connectionAtom);
  const metadata = get(metadataAtom);

  if (!publicKey) return [];

  const userTokenAssociatedAddresses = await Promise.all(
    uniqueAssets.map(async (asset) => {
      const userTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(asset),
        new PublicKey(publicKey),
        true,
      );
      return userTokenAccount;
    }),
  );

  const userAssociatedTokenAccounts = await getBatchMultipleAccountsInfo(
    userTokenAssociatedAddresses,
    connection,
  );

  const nativeSolBalance = await connection.getBalance(
    new PublicKey(publicKey),
  );

  const assets = userAssociatedTokenAccounts
    .map((account, index) => {
      if (!account) return null;
      const address = userTokenAssociatedAddresses[index].toBase58();
      const parsedAccount = unpackAccount(address, account);
      const mintAddress = parsedAccount.mint.toBase58();
      const tokenMetadata = metadata[mintAddress];
      const decimals = tokenMetadata?.decimals ?? 0;

      return {
        decimals,
        symbol:
          tokenMetadata?.symbol === 'SOL' ? 'wSOL' : tokenMetadata?.symbol,
        address,
        amount: new BigNumber(parsedAccount.amount).shiftedBy(-decimals),
        mintAddress: tokenMetadata?.symbol === 'SOL' ? 'wSOL' : mintAddress,
      };
    })
    .filter(Boolean) as WalletType;

  const solInPool = uniqueAssets.find((a) => a === NATIVE_MINT.toBase58());

  return solInPool
    ? assets.concat([
        {
          decimals: Math.log10(LAMPORTS_PER_SOL),
          symbol: 'SOL',
          address: await getAssociatedTokenAddress(
            NATIVE_MINT,
            new PublicKey(publicKey),
            true,
          ),
          amount: new BigNumber(nativeSolBalance).dividedBy(LAMPORTS_PER_SOL),
          mintAddress: NATIVE_MINT.toBase58(),
        },
      ])
    : assets;
});
