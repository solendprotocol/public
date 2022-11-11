import { PublicKey } from '@solana/web3.js';
import { Client, Token } from '@solflare-wallet/utl-sdk';

export interface TokenInfo {
    mintAddress: string;
    tokenSymbol: string;
    logoUri: string;
}

const utl = new Client();

export async function getTokensInfo(mints: PublicKey[]): Promise<TokenInfo[]> {
    const tokens: Token[] = await utl.fetchMints(mints);
    const tokenInfo = tokens.map((token) => {
        return {
            mintAddress: token.address,
            tokenSymbol: token.symbol,
            logoUri: token.logoURI,
        }
    });
    return tokenInfo;
}