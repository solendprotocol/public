import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import { atom } from "jotai";
import { splitAtom } from "jotai/utils";
import { fetchObligationByAddress, ObligationType } from "utils/obligations";
import { connectionAtom, selectedPoolAtom } from "./pools";

export const obligationsAtom = atom<Array<ObligationType>>(
    []
);

export const obligationAtomsAtom = splitAtom(obligationsAtom);

export const selectedObligationAddressAtom = atom<PublicKey | null>(null)

export const selectedObligationAtom = atom((get) => {
    const selectedObligationAddress = get(selectedObligationAddressAtom);
    const obligations = get(obligationsAtom);
    return obligations.find(obligation => (selectedObligationAddress && obligation.address.equals(selectedObligationAddress)));
}, (get, set, newSelectedObligationAddress: PublicKey | null) => {
    console.log('should be after wtf');
    if (!newSelectedObligationAddress) return;

    const obligationAtoms = get(obligationAtomsAtom);
    const connection = get(connectionAtom);
    console.log(obligationAtoms)
    const selectedAtom = obligationAtoms.find(obligationAtom => get(obligationAtom).address.equals(newSelectedObligationAddress));
    console.log(newSelectedObligationAddress.toBase58())
    if (!selectedAtom) {
        throw 'Selected obligation not found';
    }

    console.log('fetchObligationByAddress');
    fetchObligationByAddress(newSelectedObligationAddress, connection).then(obligation => {
        debugger;
        if (obligation) {
            set(selectedAtom, obligation)
        }
    })

    set(selectedObligationAddressAtom, newSelectedObligationAddress);
});
