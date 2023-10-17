import { atom } from 'jotai';
import { fetchPoolMetadata } from '@solendprotocol/solend-sdk';
import { connectionAtom } from './settings';
import { ENVIRONMENT, DEBUG_MODE } from 'common/config';

export const configAtom = atom(async (get) => {
  const connection = get(connectionAtom);

  const a = await fetchPoolMetadata(connection, ENVIRONMENT, true, DEBUG_MODE);

  console.log(a);
  return a;
});
