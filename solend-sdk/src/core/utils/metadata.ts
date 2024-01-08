import { AccountInfo, Connection, ParsedAccountData, PublicKey } from "@solana/web3.js";
import { Metaplex, Nft } from "@metaplex-foundation/js";
import { getMultipleAccounts } from "./utils";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";

export enum Tag {
  LP_TOKEN = 'lp-token',
}
export interface Token {
  name: string
  symbol: string
  logoURI: string | null
  verified?: boolean
  address: string
  tags?: Set<Tag>
  decimals: number | null
  holders?: number | null
}

const transformMetaplexToken = (nft: Nft, additionalData: object, decimalsMap: any): Token => {
  return {
    name: nft.name,
    symbol: nft.symbol,
    logoURI: nft.json?.image ?? null,
    address: nft.mint.toString(),
    decimals: decimalsMap[nft.mint.toString()] || 6,
    ...additionalData
  }
}

export const fetchTokensInfo = async (
  mints: string[],
  connection: Connection,
  debug?: boolean
) => {
  if (debug) console.log("getTokensInfo");

  const metaplex = new Metaplex(connection);
  const accounts = (await metaplex.nfts().findAllByMintList({mints: mints.map(m => new PublicKey(m))})).filter((nft) => nft?.tokenStandard === TokenStandard.Fungible) as Nft[];
  const mintsToFetch = accounts.map((nft) => nft.mint);

  // Fetch decimals for all mints with metadata in a single call
  const decimalsMap: any = {};
  if (mintsToFetch.length > 0) {
    const parsedAccounts = await getMultipleAccounts(
      connection.rpcEndpoint,
      mintsToFetch.map((key) => key.toString()),
    );

    
    parsedAccounts.forEach(({ pubkey, data }: any) => {
      decimalsMap[pubkey] = data.parsed.info.decimals;
    });
  }

  return accounts.map((account) => {
    return transformMetaplexToken(account, { verified: false, source: 'METAPLEX' }, decimalsMap);
  });
};
