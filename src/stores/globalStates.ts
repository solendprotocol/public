import { Connection } from "@solana/web3.js";
import SwitchboardProgram from "@switchboard-xyz/sbv2-lite";
import { MAIN_POOL_ADDRESS, RPC_ENDPOINT } from "common/config";
import { atom, PrimitiveAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const themeAtom = atomWithStorage("theme", "dark");
export const sbv2ProgramAtom = atom<SwitchboardProgram | null>(null); // is loaded once on mount

interface PoolAtomType {
  address: string;
  name: string | undefined;
}
export const selectedPoolAtom: PrimitiveAtom<PoolAtomType> = atom({
  address: MAIN_POOL_ADDRESS,
  name: "main",
});

export const rpcEndpointAtom = atom<{ name: string, endpoint: string }>(
  { name: RPC_ENDPOINT.name, endpoint: RPC_ENDPOINT.endpoint }
);

export const connectionAtom = atom<Connection>(new Connection(RPC_ENDPOINT.endpoint, "confirmed"));