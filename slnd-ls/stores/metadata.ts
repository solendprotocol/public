import { atom } from "jotai";
import { getTokensInfo } from "utils/metadata";
import { loadObligationsAtom, obligationsAtom, selectedObligationAtom } from "./obligations";
import { connectionAtom, selectedPoolAddressAtom, selectedPoolAtom, unqiueAssetsAtom } from "./pools";

export type TokenMetadata = {[mintAddress: string]: {
    symbol: string,
    logoUri: string | null,
    decimals: number
}}

export const metadataAtom = atom<Promise<TokenMetadata>>(
    async (get) => {
        const mints = get(unqiueAssetsAtom);    
        const connection = get(connectionAtom);

        return mints.length ? await getTokensInfo(mints, connection) : Promise.resolve({});
    }
);
