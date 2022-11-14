import { PublicKey } from '@solana/web3.js';
import { Client, Token } from '@solflare-wallet/utl-sdk';

export interface TokenInfo {
    tokenSymbol: string;
    logoUri: string;
}

const utl = new Client();

export const getTokensInfo = async (mints: PublicKey[]) => {
    const tokens: Token[] = await utl.fetchMints(mints);
    const tokenDict: { [key: string]: TokenInfo } = {};
    for (var token of tokens) {
        tokenDict[token.address] = {
            tokenSymbol: token.symbol,
            logoUri: token.logoURI,
        };
    }
    return tokenDict;
};

