import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { EnvironmentType, getProgramId } from '@solendprotocol/solend-sdk';

export const DEBUG_MODE = Boolean(process.env.NEXT_PUBLIC_DEBUG);
export const SKIP_PREFLIGHT = Boolean(process.env.NEXT_PUBLIC_SKIP_PREFLIGHT);
export const ENVIRONMENT =
  (process.env.NEXT_PUBLIC_REACT_APP_NETWORK as EnvironmentType) ||
  WalletAdapterNetwork.Devnet;
export const PROGRAM_ID = getProgramId(ENVIRONMENT).toBase58();
export const HOST_ATA = process.env.NEXT_PUBLIC_REACT_HOST_ATA;
export const DEFAULT_RPC_ENDPOINTS = [
  {
    name: 'RPCPool',
    endpoint: process.env.NEXT_PUBLIC_RPC_1 as string,
  },
  {
    name: 'Alchemy RPC',
    endpoint: process.env.NEXT_PUBLIC_RPC_2 as string,
  },
].filter(Boolean) as Array<{ name: string; endpoint: string }>;

export const MAIN_POOL_ADDRESS = '4UpD2fh7xH3VP9QQaXtsS1YY3bxzWhtfpks7FatyKvdY';

export const ENDPOINTS = [
  {
    key: 'rpcpool',
    name: 'RPCPool',
    endpoint: process.env.NEXT_PUBLIC_RPCPOOL_RPC as string,
  },
  {
    key: 'alchemy',
    name: 'Alchemy',
    endpoint: process.env.NEXT_PUBLIC_ALCHEMY_RPC as string,
  },
];
