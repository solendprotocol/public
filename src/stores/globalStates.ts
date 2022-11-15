import { MAIN_POOL_ADDRESS } from "common/config";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const themeAtom = atomWithStorage("theme", "dark");
export const selectedPoolAtom = atom({
    address: MAIN_POOL_ADDRESS,
    name: "main",
});