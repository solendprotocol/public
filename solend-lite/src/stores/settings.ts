import { atomWithStorage } from 'jotai/utils';
import { DEFAULT_RPC_ENDPOINTS } from 'common/config';
import { atom } from 'jotai';
import { Connection } from '@solana/web3.js';
import SwitchboardProgram from '@switchboard-xyz/sbv2-lite';

type RpcEndpoint = {
  name: string;
  endpoint: string;
};

export const selectedRpcAtom = atomWithStorage<RpcEndpoint>(
  'selectedRpc',
  DEFAULT_RPC_ENDPOINTS[0],
);

export const refreshCounterAtom = atom(0);

export const refreshPageAtom = atom(
  (get) => get(refreshCounterAtom),
  (_, set) => set(refreshCounterAtom, (i) => i + 1),
);

export const connectionAtom = atom<Connection>((get) => {
  const rpc = get(selectedRpcAtom);
  return new Connection(rpc.endpoint, 'confirmed');
});

export const switchboardAtom = atom(async (get) => {
  const connection = get(connectionAtom);
  return SwitchboardProgram.loadMainnet(connection);
});
