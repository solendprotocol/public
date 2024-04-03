import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey } from '@metaplex-foundation/umi';
import { safeFetchAllMetadata, mplTokenMetadata, Metadata } from '@metaplex-foundation/mpl-token-metadata'
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, MintLayout, RawMint } from '@solana/spl-token';
import { getBatchMultipleAccountsInfo } from './utils';
import axios from 'axios';

export const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// This is not an official program but a community deployement
const TOKEN_2022_METADATA_PROGRAM_ID = new PublicKey('META4s4fSmpkTbZoUsgC1oBnWB31vQcmnN8giPw51Zu');

export interface TokenExtensions {
    readonly website?: string;
    readonly bridgeContract?: string;
    readonly assetContract?: string;
    readonly address?: string;
    readonly explorer?: string;
    readonly twitter?: string;
    readonly github?: string;
    readonly medium?: string;
    readonly tgann?: string;
    readonly tggroup?: string;
    readonly discord?: string;
    readonly serumV3Usdt?: string;
    readonly serumV3Usdc?: string;
    readonly coingeckoId?: string;
    readonly imageUrl?: string;
    readonly description?: string;
}

export interface TokenInfo {
    readonly chainId: number;
    readonly address: string;
    readonly name: string;
    readonly decimals: number;
    readonly symbol: string;
    readonly logoURI?: string;
    readonly tags?: string[];
    readonly extensions?: TokenExtensions;
}

interface ImageResponse {
    image: string;
    description: string;
  }

interface RawMintWithProgramId extends RawMint {
    programId: PublicKey;
  }

export function findMetadataAddress(mint: PublicKey, tokenProgramId: PublicKey): PublicKey {
  const metadataProgramId = tokenProgramId.equals(TOKEN_PROGRAM_ID)
    ? TOKEN_METADATA_PROGRAM_ID
    : TOKEN_2022_METADATA_PROGRAM_ID;

  return PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), metadataProgramId.toBuffer(), mint.toBuffer()],
    metadataProgramId,
  )[0];
}

export async function fetchMintInfos(
    connection: Connection,
    mints: PublicKey[],
  ): Promise<Array<[string, RawMintWithProgramId]>> {
    const results = (await getBatchMultipleAccountsInfo(mints, connection)).reduce((acc, accountInfo, idx) => {
      if (accountInfo) {
        acc.push([
          mints[idx].toString(),
          {
            ...MintLayout.decode(accountInfo.data),
            programId: accountInfo.owner,
          },
        ]);
      }
      return acc;
    }, new Array<[string, RawMintWithProgramId]>());
  
    return results;
  }


export const fetchTokensInfo = async (
    connection: Connection,
  mints: string[],
) => {
  const mintInfos = await fetchMintInfos(
    connection,
    mints.map((m) => new PublicKey(m))
)

  const umi = createUmi(connection.rpcEndpoint);

  const mintsWithProgramId = mintInfos.map(([mint, rawMintWithProgramId]) => ({
    mint: new PublicKey(mint),
    decimals: rawMintWithProgramId.decimals,
    programId: rawMintWithProgramId.programId,
  }))
  const metadataAddresses = mintsWithProgramId.map((t) => publicKey(findMetadataAddress(t.mint, t.programId)));
  umi.use(mplTokenMetadata());
  const metadata = await safeFetchAllMetadata(umi, metadataAddresses)

  console.log(metadata)
  return metadata.map((m, index) => ({
    decimals: mintsWithProgramId[index].decimals,
    ...m,
  }));
};

function checkImageURL(url: string) {
    return url.match(/\.(webp|svg|jpeg|jpg|gif|png)$/) != null;
  }
  export const getTokenInfosFromMetadata = async (
    mints: string[],
    connection: Connection,
    debug?: boolean
  ) => {
    if (debug) console.log("getTokensInfo");;
  
    const tokenMetadatas = await fetchTokensInfo(
      connection,
      mints,
    );
  
    let tokenInfos: TokenInfo[] = [];
    const chunks = tokenMetadatas.reduce((acc, _curr, i) => {
        if (!(i % 100)) {
          // if index is 0 or can be divided by the `size`...
          acc.push(tokenMetadatas.slice(i, i + 100)); // ..push a chunk of the original array to the accumulator
        }
        return acc;
      }, [] as (Metadata & {decimals: number})[][]);
    
    for (let chunkedTokenMetadatas of chunks) {
      tokenInfos.push(
        ...(await Promise.all(
          chunkedTokenMetadatas.map(async ({ uri, mint, name, symbol, decimals }) => {  
            // some url might be image url while others are image metadata which we need to fetch
            let image: string | undefined = undefined;
            if (uri) {
              if (checkImageURL(uri)) {
                image = uri;
              } else {
                try {
                    image = (await axios.get(uri, {
                      timeout: 5000,
                      maxRedirects: 5,
                    })).data.image;
                } catch (e) {
                    console.error(`failed to fetch image for ${symbol}`)
                }
              }
            }
  
            if (mint.toString() === 'n54ZwXEcLnc3o7zK48nhrLV4KTU5wWD4iq7Gvdt5tik') {
                console.log('peepo', uri, image)
            }
            console.log(uri, image);
            const tokenInfo: TokenInfo = {
              address: mint.toString(),
              chainId: 101,
              decimals,
              name,
              symbol,
              logoURI: image,
            };
            return tokenInfo;
          }),
        )),
      );
    }
    return tokenInfos;
  };