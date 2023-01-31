import { Text, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Flex, Avatar } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useEffect } from "react";
import Image from 'next/image'
import { poolsAtom, selectedPoolAtom, selectedPoolStateAtom, SelectedReserveType } from 'stores/pools';
import { formatPercent, formatToken, formatUsd } from "utils/numberFormatter";

export default function Pool({selectReserveWithModal}: {selectReserveWithModal: (reserve: SelectedReserveType) => void}) {
    const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);
    const [selectedPoolState] = useAtom(selectedPoolStateAtom);
    const [pools] = useAtom(poolsAtom);

    useEffect(() => {
        if (Object.keys(pools).length > 0) {
            setSelectedPool(Object.values(pools)[0].address)
        }
    }, [Boolean(pools.length)])

    console.log(pools, selectedPoolState);
    if (selectedPoolState === 'loading') return <div>Loading...</div>;

    return  <TableContainer>
    <Table size='sm'>
      <Thead>
        <Tr>
          <Th><Text>Asset name</Text></Th>
          <Th><Text>LTV</Text></Th>
          <Th isNumeric><Text>Total supply</Text></Th>
          <Th isNumeric><Text>Supply APR</Text></Th>
          <Th isNumeric><Text>Total borrow</Text></Th>
          <Th isNumeric><Text>Borrow APR</Text></Th>
        </Tr>
      </Thead>
      <Tbody>
        {selectedPool?.reserves.map(reserve =>  <Tr key={reserve.address} onClick={() => selectReserveWithModal(reserve)}>
          <Td><Flex gap={4}>
            {reserve.logo ? <Image
            src={reserve.logo ?? ''}
            alt={`logo for ${reserve.symbol}`}
            width={32}
            height={32}
          /> : <Avatar icon={<Avatar
            width={8}
            height={8}
            name="U" borderRadius={100}/>} w={8} h={8} borderRadius={100} name={reserve.symbol}/>}<Text>{reserve.symbol ?? `${reserve.mintAddress.slice(0,4)}...${reserve.mintAddress.slice(-4,reserve.mintAddress.length-1)}`} ({formatUsd(reserve.price)})</Text></Flex></Td>
          <Td isNumeric><Text>{formatPercent(reserve.loanToValueRatio)}</Text></Td>
          <Td isNumeric><Text>{formatToken(reserve.totalSupply)}</Text></Td>
          <Td isNumeric><Text>{formatPercent(reserve.supplyInterest)}</Text></Td>
          <Td isNumeric><Text>{formatToken(reserve.totalBorrow)}</Text></Td>
          <Td isNumeric><Text>{formatPercent(reserve.borrowInterest)}</Text></Td>
        </Tr>)}
      </Tbody>
    </Table>
  </TableContainer>
}