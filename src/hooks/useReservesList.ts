import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { selectedPoolAtom } from "stores/globalStates";
import { PublicKey } from "@solana/web3.js";
import { ReserveViewModel } from "models/Reserves";
import { getReserves } from "../utils/reserves";


export function useReservesList(): {
    reservesList: ReserveViewModel[] | null,
    isLoading: boolean,
    isError: boolean,
} {
    const [selectedPool] = useAtom(selectedPoolAtom);
    const [reservesList, setReservesList] = useState<ReserveViewModel[] | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function getReservesList() {
            try {
                const reserves = await getReserves(new PublicKey(selectedPool.address));
                setReservesList(reserves);
            } catch (error) {
                setError(true);
            }
        }
        getReservesList();
    }, [selectedPool]);

    return {
        reservesList: reservesList ? reservesList : null,
        isLoading: !error && !reservesList,
        isError: error,
    };
}
