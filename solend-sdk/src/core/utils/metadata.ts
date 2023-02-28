import { Client, Token } from "@solflare-wallet/utl-sdk";
import { Connection, PublicKey } from "@solana/web3.js";

export const fetchTokensInfo = async (
  mints: string[],
  connection: Connection,
  debug?: boolean
) => {
  if (debug) console.log("getTokensInfo");

  const defaultConfig = new Client();
  const utl = new Client({
    ...defaultConfig.config,
    connection,
  });

  const tokens: Token[] = await utl.fetchMints(
    mints.map((mint) => new PublicKey(mint))
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
          : []
      )
      .filter((x) => x.length)
  );
};
