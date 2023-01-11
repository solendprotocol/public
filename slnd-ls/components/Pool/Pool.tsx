import { List, ListItem } from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { poolsAtom, ReserveType, selectedPoolAtom } from 'stores/pools';

export default function Pool({selectReserveWithModal}: {selectReserveWithModal: (reserve: ReserveType) => void}) {
    const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);
    const [pools] = useAtom(poolsAtom);

    useEffect(() => {
        if (Object.keys(pools).length > 0) {
            setSelectedPool(Object.values(pools)[0].address)
        }
    }, [Boolean(pools.length)])

    return  <List spacing={3}>
        {selectedPool?.reserves.map(reserve => <ListItem key={reserve.address.toBase58()} onClick={() => selectReserveWithModal(reserve)}>
        {reserve.address.toBase58()}
    </ListItem>)}
</List>
}