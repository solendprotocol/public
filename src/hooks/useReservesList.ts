import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { connectionAtom, sbv2ProgramAtom, selectedPoolAtom } from "stores/globalStates";
import { PublicKey } from "@solana/web3.js";
import { getReserves } from "../utils/reserves";

export function useReservesList(): {
    reservesList: ReserveViewModel[] | null,
    isLoading: boolean,
    isError: boolean,
} {
    const [connection] = useAtom(connectionAtom);
    const [selectedPool] = useAtom(selectedPoolAtom);
    const [sbv2Program] = useAtom(sbv2ProgramAtom);
    const [reservesList, setReservesList] = useState<ReserveViewModel[] | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        setReservesList(null);
        async function getReservesList() {
            try {
                if (!sbv2Program) { return; }
                const reserves = await getReserves(new PublicKey(selectedPool.address), connection, sbv2Program);
                setReservesList(reserves);
            } catch (error) {
                setError(true);
            }
        }
        getReservesList();
    }, [selectedPool, sbv2Program, connection]);

    return {
        reservesList,
        isLoading: !error && !reservesList,
        isError: error,
    };
}
