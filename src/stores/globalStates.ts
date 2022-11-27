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
