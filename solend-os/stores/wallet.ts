import { PublicKey } from "@solana/web3.js";
import { atom } from "jotai";

export const publicKeyAtom = atom<PublicKey | null>(
    null
);