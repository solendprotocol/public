import { MAIN_POOL_ADDRESS } from "common/config";
import { atom, PrimitiveAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const themeAtom = atomWithStorage("theme", "dark");

interface PoolAtomType {
  address: string;
  name: string | undefined;
}
export const selectedPoolAtom: PrimitiveAtom<PoolAtomType> = atom({
  address: MAIN_POOL_ADDRESS,
  name: "main",
});
export const RPC_ENDPOINT = process.env
  .NEXT_PUBLIC_REACT_APP_SOLANA_RPC_HOST as string;
export const rpcAtom = atomWithStorage("rpc", {
  name: "RPCPool",
  endpoint: RPC_ENDPOINT,
});

export const isDrawerOpenAtom = atom(false);
