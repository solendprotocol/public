import { Button, Text, Flex, Input, List, ListItem, Center } from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { configAtom, selectedPoolAtom } from 'stores/pools';

export default function Nav() {
    const [showCustomPool, setShowCustomPool] = useState<boolean>(false);
    const [newPoolAddress, setNewPoolAddress] = useState<string>('');
    const [config] = useAtom(configAtom);
    const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);

    useEffect(() => {
        setNewPoolAddress(selectedPool?.address ?? '')
    }, [selectedPool?.address])

    return  <div>
        <Center p={2} h={50}>
        {showCustomPool ? <Input
            value={newPoolAddress}
            onChange={(event) => setNewPoolAddress(event.target.value)}
            onKeyDown={(event) => {
                if (event.key === 'Enter') {
                    setSelectedPool(newPoolAddress)
                  }
            }}
        /> : <Button onClick={() => setShowCustomPool(!showCustomPool)}>Enter custom pool</Button>}

</Center>
            
            <List spacing={3}>
    {config.map(pool => <ListItem p={2} bg={(selectedPool && pool.address === selectedPool.address) ? 'neutralAlt': undefined} key={pool.address} 
        onClick={() => setSelectedPool(pool.address)}
    >
        <Text>
            {pool.name ?? 'Unnamed pool'}
        </Text>
        <Text variant="captionMono" color="secondary" noOfLines={1}>
                {pool.address}
        </Text>
    </ListItem>)}
</List>
</div>
}