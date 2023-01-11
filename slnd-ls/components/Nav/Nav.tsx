import { Button, Grid, GridItem, List, ListItem } from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { useAtom, useSetAtom } from "jotai";
import { useEffect } from "react";
import { configAtom, selectedPoolAtom } from 'stores/pools';

export default function Nav() {
    const [config] = useAtom(configAtom);
    const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);

    return  <List spacing={3}>
    {config.map(address => <ListItem key={address.toBase58()} 
        onClick={() => setSelectedPool(address)}
    >
        {(selectedPool && address.equals(selectedPool.address)) ? <u>{address.toBase58()}</u> : 
            address.toBase58()}
    </ListItem>)}
</List>
}