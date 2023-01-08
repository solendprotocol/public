import { Grid, GridItem, List, ListItem } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { poolsAtom, selectedPoolAtom } from 'stores/pools';
import { RPC_ENDPOINT, ENVIRONMENT } from "utils/config";

export function Nav() {
    const [pools] = useAtom(poolsAtom);
    const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);

return  <List spacing={3}>
    {pools.map(pool => <ListItem key={pool.address.toBase58()} onClick={() => setSelectedPool(pool.address)}>
        {pool.address === selectedPool?.address ? <u>{pool.address.toBase58()}</u> : pool.address.toBase58()}
    </ListItem>)}
    
</List>
}