import { List, ListItem } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { selectedPoolAtom } from 'stores/pools';

export default function Pools() {
    const [selectedPool] = useAtom(selectedPoolAtom);
    return  <List spacing={3}>
        {selectedPool?.reserves.map(reserve => <ListItem key={reserve.pubkey.toBase58()}>
        {reserve.pubkey.toBase58()}
    </ListItem>)}
</List>
}