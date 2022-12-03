import { useEffect, useState } from "react";
import { getPools } from "../utils/pools";

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
        poolList,
        isLoading: !error && !poolList,
        isError: error,
    };
}
