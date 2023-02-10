import { atomWithStorage } from 'jotai/utils';
import { DEFAULT_RPC_ENDPOINTS } from 'utils/config';

type RpcEndpoint = {
  name: string;
  endpoint: string;
};

export const selectedRpcAtom = atomWithStorage<RpcEndpoint>(
  'selectedRpc',
  DEFAULT_RPC_ENDPOINTS[0],
);
