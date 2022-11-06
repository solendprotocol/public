import { useEffect, useState } from "react";
import { getPools, PoolViewModel } from "../functions";


export function usePoolsList(): {
    poolList: PoolViewModel[] | null,
    isLoading: boolean,
    isError: boolean,
} {
    const [poolList, setPoolList] = useState<PoolViewModel[] | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function getPoolList() {
            try {
                const pools = await getPools();
                setPoolList(pools);
            } catch (error) {
                setError(true);
            }
        }
        getPoolList();
    }, []);


    return {
        poolList: poolList ? poolList : null,
        isLoading: !error && !poolList,
        isError: error,
    };
}
