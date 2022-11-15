import { PublicKey } from '@solana/web3.js';
import { Client, Token } from '@solflare-wallet/utl-sdk';

const utl = new Client();

export const getTokensInfo = async (mints: PublicKey[]) => {
    const tokens: Token[] = await utl.fetchMints(mints);
    const tokenDict = new Map<string, TokenInfo>();
    for (var token of tokens) {
        tokenDict.set(token.address, {
            tokenSymbol: token.symbol,
            logoUri: token.logoURI,
        });
    }
    return tokenDict;
};