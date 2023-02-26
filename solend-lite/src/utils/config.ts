import { Connection } from '@solana/web3.js';
import { LENDING_MARKET_SIZE } from '@solendprotocol/solend-sdk';
import { PROGRAM_ID, SOLEND_ADDRESSES } from 'common/config';
import { titleCase } from './formatUtils';

export async function fetchConfig(
  connection: Connection,
): Promise<Array<{ name: string | null; address: string; owner: string }>> {
  if (process.env.NEXT_PUBLIC_DEBUG) console.log('fetchConfig');

  try {
    const configResponse = await fetch(
      `https://api.solend.fi/v1/markets/configs?scope=all&deployment=production`,
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
    return getPoolsFromChain(connection);
  }
}

export const getPoolsFromChain = async (connection: Connection) => {
  if (process.env.NEXT_PUBLIC_DEBUG) console.log('getPoolsFromChain');
  const filters = [
    { dataSize: LENDING_MARKET_SIZE },
    //   { memcmp: { offset: 2, bytes: SOLEND_ADDRESSES[0] } },
  ];

  const pools = await connection.getProgramAccounts(PROGRAM_ID, {
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
