import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { connectionAtom } from "stores/globalStates";
import { getPools } from "../utils/pools";

export function usePoolsList(): {
    poolList: PoolViewModel[] | null,
    isLoading: boolean,
    isError: boolean,
} {
    const [connection] = useAtom(connectionAtom);
    const [poolList, setPoolList] = useState<PoolViewModel[] | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function getPoolList() {
            try {
                const pools = await getPools(connection);
                setPoolList(pools);
            } catch (error) {
                setError(true);
            }
        }
        getPoolList();
    }, []);

    return {
        poolList,
        isLoading: !error && !poolList,
        isError: error,
    };
}
