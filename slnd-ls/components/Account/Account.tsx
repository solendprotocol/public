import { Text, List, ListItem, Input, Button, Center, Table, TableContainer, Tbody, Td, Th, Thead, Tr  } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import AccountMetrics from "components/AccountMetrics/AccountMetrics";
import { useAtom, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { metadataAtom } from "stores/metadata";
import { loadableObligationAtom, selectedObligationAtom } from "stores/obligations";
import { poolsAtom, poolsStateAtom, reserveToMintMapAtom } from "stores/pools";
import { formatToken } from "utils/numberFormatter";

export default function Account() {
    const [changed, setChanged] = useState<boolean>(false);
    const [showCustomObligation, setShowCustomObligation] = useState<boolean>(false);
    const [newObligationAddress, setNewObligationAddress] = useState<string>('');
    const [ selectedObligation, setSelectedObligation ] = useAtom(selectedObligationAtom);
    const [poolState] = useAtom(poolsStateAtom);
    
    const [ reserveToMintMap ] = useAtom(reserveToMintMapAtom);
    const [metadata] = useAtom(metadataAtom);

    useEffect(() => {
        if (selectedObligation?.address?.length && changed) {
            setNewObligationAddress(selectedObligation?.address ?? '')
        }
    }, [selectedObligation?.address])

    if (poolState === 'loading') return <div>Loading...</div>;

    return <div>
        <AccountMetrics/>
    <Center p={2} h={50}>
        {showCustomObligation ? <Input
            value={newObligationAddress}
            onChange={(event) => {
                setNewObligationAddress(event.target.value)
                setChanged(true);
            }}
            onKeyDown={(event) => {
                if (event.key === 'Enter') {
                    setSelectedObligation({newSelectedObligationAddress: newObligationAddress})
                  }
            }}
        /> : <Button w="100%" h="100%" onClick={() => setShowCustomObligation(!showCustomObligation)}>Enter custom account</Button>}
        </Center>
        <TableContainer key="supplyTable">
    <Table size='sm'>
      <Thead>
        <Tr>
          <Th w={200}><Text>Asset supplied</Text></Th>
          <Th><Text>Balance</Text></Th>
        </Tr>
      </Thead>
      <Tbody>
        {selectedObligation?.deposits.map(position => <Tr key={position.reserveAddress}>
          <Td><Text>{position.symbol} ({position.price?.toString()})</Text></Td>
          <Td isNumeric><Text>{formatToken(position.amount.toNumber())}</Text></Td>
        </Tr>)}
      </Tbody>
    </Table>
  </TableContainer>
        <TableContainer key="borrowTable">
    <Table size='sm'>
      <Thead>
        <Tr>
          <Th w={200}><Text>Asset borrowed</Text></Th>
          <Th><Text>Balance</Text></Th>
        </Tr>
      </Thead>
      <Tbody>
        {selectedObligation?.borrows.map(position => <Tr key={position.reserveAddress}>
          <Td><Text>{position.symbol} ({position.price?.toString()})</Text></Td>
          <Td isNumeric><Text>{formatToken(position.amount.toNumber())}</Text></Td>
        </Tr>)}
      </Tbody>
    </Table>
  </TableContainer>
</div>
}