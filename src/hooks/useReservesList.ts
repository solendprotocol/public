import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { selectedPoolAtom } from "stores/globalStates";
import { PublicKey } from "@solana/web3.js";
import { getReserves } from "../utils/reserves";
import SwitchboardProgram from "@switchboard-xyz/sbv2-lite";
import { CONNECTION } from "common/config";

const connection = CONNECTION;

export function useReservesList(): {
    reservesList: ReserveViewModel[] | null,
    isLoading: boolean,
    isError: boolean,
} {
    const [selectedPool] = useAtom(selectedPoolAtom);
    const [reservesList, setReservesList] = useState<ReserveViewModel[] | null>(null);
    const [error, setError] = useState(false);

    const [sbv2Program, setSbv2Program] = useState<SwitchboardProgram | null>(null);

    useEffect(() => {
        // load sbv2Program once on mount
        async function loadSbv2Program() {
            const sbv2 = await SwitchboardProgram.loadMainnet(connection);
            setSbv2Program(sbv2);
        }
        loadSbv2Program();
    }, []);

    useEffect(() => {
        async function getReservesList() {
            try {
                if (!sbv2Program) { return; }
                const reserves = await getReserves(new PublicKey(selectedPool.address), sbv2Program);
                setReservesList(reserves);
            } catch (error) {
                setError(true);
            }
        }
        getReservesList();
    }, [selectedPool, sbv2Program]);

    return {
        reservesList: reservesList ? reservesList : null,
        isLoading: !error && !reservesList,
        isError: error,
    };
}
