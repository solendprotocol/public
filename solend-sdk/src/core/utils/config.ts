import { Cluster, Connection } from '@solana/web3.js';
import { EnvironmentType, getProgramId, LENDING_MARKET_SIZE } from '@solendprotocol/solend-sdk';
import { SOLEND_ADDRESSES } from '../constants';
import { titleCase } from './utils';
import { PoolMetadataCoreType } from '@solendprotocol/solend-sdk';

export async function fetchPoolMetadata(
  connection: Connection,
  environment: EnvironmentType = 'production',
  useApi?: Boolean,
  debug?: Boolean,
): Promise<Array<PoolMetadataCoreType>> {
  if (debug) console.log('fetchConfig');

  if (!useApi) return fetchPoolMetadataFromChain(connection, environment);

  try {
    const configResponse = await fetch(
      `https://api.solend.fi/v1/markets/configs?scope=all&deployment=${environment === 'mainnet-beta' ? 'production' : environment}`,
    );
    if (!configResponse.ok) {
      // fallback
      throw Error('Solend backend configs failed.')
    }
  
    const configData = await configResponse.json();
    return configData.map(
      (c: { name: string; address: string; owner: string }) => ({
        name: titleCase(c.name),
        owner: c.owner,
        address: c.address,
      }),
    );

  } catch (e) {
    return fetchPoolMetadataFromChain(connection, environment);
  }
}

export const fetchPoolMetadataFromChain = async (connection: Connection, environment: EnvironmentType) => {
  if (process.env.NEXT_PUBLIC_DEBUG) console.log('fetchPoolsFromChain');
  const filters = [
    { dataSize: LENDING_MARKET_SIZE },
  ];

  const pools = await connection.getProgramAccounts(getProgramId(environment), {
    commitment: connection.commitment,
    filters,
    encoding: 'base64',
  });

  const poolList = pools.map((pool) => {
    return {
      owner: pool.account.owner.toBase58(),
      address: pool.pubkey.toBase58(),
    };
  });

  return poolList
    .sort((a, _b) => (a.owner === SOLEND_ADDRESSES[0] ? 1 : -1))
    .map((pool) => ({
      name: null,
      owner: pool.owner,
      address: pool.address,
    }));
};
