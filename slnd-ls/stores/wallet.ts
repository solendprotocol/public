import { AccountLayout, ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { atom } from "jotai";
import { getBatchMultipleAccountsInfo } from "utils/common";
import { PROGRAM_ID } from "utils/config";
import { loadObligationsAtom, obligationsAtom, selectedObligationAtom } from "./obligations";
import { connectionAtom, selectedPoolAddressAtom, unqiueAssetsAtom } from "./pools";

type WalletAssetType = {
    amount: number;
    mintAddress: PublicKey;
}

export const publicKeyAtom = atom<PublicKey | null>(
    null
);

export const setPublicKeyAtom = atom(
    (get) => get(publicKeyAtom),
    async (get, set, newPublicKey: PublicKey | null) => {
        set(publicKeyAtom, newPublicKey);
        console.log('set new newPublicKey', newPublicKey);
        if (!newPublicKey) {
            set(obligationsAtom, {});
            return;
        }
        const selectedPoolAddress = get(selectedPoolAddressAtom);
        await set(loadObligationsAtom, false);
        if (selectedPoolAddress) {
            set(selectedObligationAtom, {
                newSelectedObligationAddress: await PublicKey.createWithSeed(
                newPublicKey,
                selectedPoolAddress.toBase58().slice(0, 32),
                PROGRAM_ID,
                
            ),
            lendingMarket: selectedPoolAddress})
        }
        set(loadObligationsAtom, true);
    }
);

export const walletAssetsAtom = atom(async (get) => {
    const uniqueAssets = get(unqiueAssetsAtom);
    const publicKey = get(publicKeyAtom);
    const connection = get(connectionAtom);

    const a = Token;
    debugger;
    if (!publicKey) return [];

    const userTokenAssociatedAddresses = await Promise.all(
            uniqueAssets.map(async (asset) => {
            const userTokenAccount = await Token.getAssociatedTokenAddress(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            asset,
            publicKey,
            true,
            );
            return userTokenAccount;
        })
    )

    const userAssociatedTokenAccounts = await getBatchMultipleAccountsInfo(
        userTokenAssociatedAddresses,
        connection,
    )

    return userAssociatedTokenAccounts.map((account, index) => {
        if (!account) return null;
        const parsedAccount = AccountLayout.decode(account.data);

        return {
            amount: u64
                    .fromBuffer(parsedAccount.amount)
                    .toNumber(),
            mintAddress: userTokenAssociatedAddresses[index],
          }
    }).filter(Boolean) as Array<WalletAssetType>;
});