import { unpackAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { atom } from "jotai";
import { createObligationAddress, getBatchMultipleAccountsInfo } from "utils/common";
import { metadataAtom } from "./metadata";
import { loadObligationsAtom, obligationsAtom, selectedObligationAtom } from "./obligations";
import { connectionAtom, selectedPoolAddressAtom, selectedPoolAtom, unqiueAssetsAtom } from "./pools";

type WalletAssetType = {
    amount: BigNumber;
    mintAddress: string;
    symbol: string;
}

export const publicKeyAtom = atom<string | null>(
    null
);

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
                newSelectedObligationAddress: await createObligationAddress(newPublicKey, selectedPoolAddress),
            poolAddress: selectedPoolAddress})
        }
        set(loadObligationsAtom, true);
    }
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
        })
    )

    const userAssociatedTokenAccounts = await getBatchMultipleAccountsInfo(
        userTokenAssociatedAddresses,
        connection
    )

    return userAssociatedTokenAccounts.map((account, index) => {
        if (!account) return null;
        const address = userTokenAssociatedAddresses[index];
        const parsedAccount = unpackAccount(address, account);
        const mintAddress = parsedAccount.mint.toBase58();
        const tokenMetadata = metadata[mintAddress];
        const decimals = tokenMetadata?.decimals ?? 0;

        return {
            decimals,
            symbol: tokenMetadata?.symbol,
            address,
            amount: new BigNumber(parsedAccount.amount).shiftedBy(-decimals),
            mintAddress,
        }

    }).filter(Boolean) as Array<WalletAssetType>;
});