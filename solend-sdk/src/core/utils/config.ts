import { Connection, PublicKey } from "@solana/web3.js";
import {
  EnvironmentType,
  getProgramId,
  LENDING_MARKET_SIZE,
  PoolMetadataCoreType,
} from "@solendprotocol/solend-sdk";
import { SOLEND_ADDRESSES } from "../constants";
import { titleCase } from "./utils";
import axios from "axios";

export async function fetchPoolMetadata(
  connection: Connection,
  environment: EnvironmentType = "production",
  useApi?: Boolean,
  debug?: Boolean
): Promise<Array<PoolMetadataCoreType>> {
  if (debug) console.log("fetchConfig");

  const programId = getProgramId(environment);
  if (!useApi) return fetchPoolMetadataFromChain(connection, programId, debug);

  try {
    const configResponse = await axios.get(
      `https://api.solend.fi/v1/markets/configs?scope=all&deployment=${
        environment === "mainnet-beta" ? "production" : environment
      }`
    );
    const configData = configResponse.data;
    return configData.map(
      (c: {
        name: string;
        address: string;
        owner: string;
        authorityAddress: string;
        reserves: Array<{
          liquidityToken: {
            name: string;
            logo: string;
            mint: string;
          };
          address: string;
        }>;
      }) => ({
        name: titleCase(c.name),
        owner: c.owner,
        address: c.address,
        authorityAddress: c.authorityAddress,
        reserves: c.reserves.map((r) => ({
          name: r.liquidityToken.name,
          logo: r.liquidityToken.logo,
          mintAddress: r.liquidityToken.mint,
          address: r.address,
        })),
      })
    );
  } catch (e) {
    return fetchPoolMetadataFromChain(connection, programId, debug);
  }
}

export const fetchPoolMetadataFromChain = async (
  connection: Connection,
  programId: PublicKey,
  debug?: Boolean
) => {
  if (debug) console.log("fetchPoolsFromChain");
  const filters = [{ dataSize: LENDING_MARKET_SIZE }];

  const pools = Array.from(
    await connection.getProgramAccounts(programId, {
      commitment: connection.commitment,
      filters,
      encoding: "base64",
    })
  );

  return pools
    .sort((a, _b) =>
      a.account.owner.toBase58() === SOLEND_ADDRESSES[0] ? 1 : -1
    )
    .map((pool) => {
      const [authorityAddress, _bumpSeed] = PublicKey.findProgramAddressSync(
        [pool.pubkey.toBytes()],
        programId
      );

      return {
        name: null,
        owner: pool.account.owner.toBase58(),
        authorityAddress: authorityAddress.toBase58(),
        address: pool.pubkey.toBase58(),
        reserves: [],
      };
    });
};
