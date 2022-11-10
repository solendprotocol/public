import { PublicKey } from "@solana/web3.js";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { selectedPoolAtom } from "stores/globalStates";
import { getReserves, ReserveViewModel } from "../functions";


export function useReservesList(): {
    reservesList: ReserveViewModel[] | null,
    isLoading: boolean,
    isError: boolean,
} {
    const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);
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
