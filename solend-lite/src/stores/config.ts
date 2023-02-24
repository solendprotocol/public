import { atom } from 'jotai';
import { fetchConfig } from 'utils/config';
import { connectionAtom } from './settings';

export type ConfigType = Awaited<ReturnType<typeof fetchConfig>>[0];

export const configAtom = atom(async (get) => {
  const connection = get(connectionAtom);
  return fetchConfig(connection);
});
