import { atom } from 'jotai';
import { selectedPoolAtom, selectedReserveAddressAtom } from './pools';

export const selectedReserveAtom = atom(
  (get) => {
    const pool = get(selectedPoolAtom);
    const selectedReserveAddress = get(selectedReserveAddressAtom);
    const reserve = pool?.reserves?.find(
      (r) => r.address === selectedReserveAddress,
    );
    return reserve;
  },
  (_get, set, newSelectedPoolAddress: string | null) => {
    set(selectedReserveAddressAtom, newSelectedPoolAddress);
  },
);

export const selectedModalTabAtom = atom(0);
