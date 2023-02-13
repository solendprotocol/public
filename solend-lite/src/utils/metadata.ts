import { Client, Token } from '@solflare-wallet/utl-sdk';
import { PublicKey } from '@solana/web3.js';

const utl = new Client();

export const getTokensInfo = async (mints: string[]) => {
  const tokens: Token[] = await utl.fetchMints(
    mints.map((mint) => new PublicKey(mint)),
  );

  return Object.fromEntries(
    tokens
      .map((token) =>
        token
          ? [
              token.address,
              {
                symbol: token.symbol,
                logoUri: token.logoURI,
                decimals: token.decimals ?? 0,
              },
            ]
          : [],
      )
      .filter((x) => x.length),
  );
};
