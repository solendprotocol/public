import { Connection, PublicKey } from "@solana/web3.js";
import {
  EnvironmentType,
  getProgramId,
  LENDING_MARKET_SIZE,
  PoolMetadataCoreType,
} from "../../index";
import { SOLEND_ADDRESSES } from "../constants";
import axios from "axios";

export async function fetchPoolMetadata(
  connection: Connection,
  environment: EnvironmentType = "production",
  customApiHost?: string,
  useApi?: Boolean,
  debug?: Boolean
): Promise<Array<PoolMetadataCoreType>> {
  if (debug) console.log("fetchConfig");

  const programId = getProgramId(environment);
  if (!useApi) return fetchPoolMetadataFromChain(connection, programId, debug);

  try {
    const configResponse = await axios.get(
      `${customApiHost ?? "https://api.save.finance"}/v1/markets/configs?scope=all&deployment=${
        environment === "mainnet-beta" ? "production" : environment
      }`
    );

    const configData = configResponse.data;
    return configData;
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
        name: pool.pubkey.toBase58(),
        owner: pool.account.owner.toBase58(),
        authorityAddress: authorityAddress.toBase58(),
        address: pool.pubkey.toBase58(),
        reserves: [],
      };
    });
};
