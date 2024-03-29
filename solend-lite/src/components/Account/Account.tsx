import {
  Text,
  Input,
  Center,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Card,
  Divider,
  useMediaQuery,
} from '@chakra-ui/react';
import AccountMetrics from 'components/AccountMetrics/AccountMetrics';
import Wallet from 'components/Wallet/Wallet';
import { useAtom, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { selectedReserveAtom, selectedModalTabAtom } from 'stores/modal';
import { selectedObligationAtom } from 'stores/obligations';
import { formatToken, formatUsd } from 'utils/numberFormatter';

export default function Account() {
  const [changed, setChanged] = useState<boolean>(false);
  const [newObligationAddress, setNewObligationAddress] = useState<string>('');
  const [selectedObligation, setSelectedObligation] = useAtom(
    selectedObligationAtom,
  );
  const setSelectedReserve = useSetAtom(selectedReserveAtom);
  const setSelectedModalTab = useSetAtom(selectedModalTabAtom);
  useEffect(() => {
    if (changed) {
      setNewObligationAddress(selectedObligation?.address ?? '');
    }
  }, [selectedObligation?.address, changed]);
  const [isLargerThan800] = useMediaQuery('(min-width: 800px)');

  return (
    <Card
      m={isLargerThan800 ? 8 : 0}
      p={isLargerThan800 ? 2 : 0}
      border='1px solid'
    >
      <Input
        placeholder='Enter custom obligation address...'
        borderColor='var(--chakra-colors-line)'
        fontSize={11}
        value={newObligationAddress}
        onChange={(event) => {
          setNewObligationAddress(event.target.value);
          setChanged(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            setSelectedObligation(newObligationAddress);
          }
        }}
      />
      <AccountMetrics />
      <Center mt={4}></Center>
      <Divider my={1} />
      <TableContainer key='supplyTable' paddingBottom={2}>
        <Table size='sm'>
          <Thead>
            <Tr>
              <Th w={200}>
                <Text color='secondary' variant='caption'>
                  Assets supplied
                </Text>
              </Th>
              <Th>
                <Text color='secondary' variant='caption' textAlign='right'>
                  Balance
                </Text>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {selectedObligation?.deposits.map((position) => (
              <Tr
                cursor='pointer'
                key={position.reserveAddress}
                onClick={() => {
                  // withdraw
                  setSelectedModalTab(2);
                  setSelectedReserve(position.reserveAddress);
                }}
              >
                <Td>
                  <Text>{position.symbol ?? 'Loading...'}</Text>
                  <Text color='secondary' variant='label'>
                    {position.price ? formatUsd(position.price?.toString()) : 0}
                  </Text>
                </Td>
                <Td isNumeric>
                  <Text>{formatToken(position.amount)}</Text>
                  <Text color='secondary' variant='label'>
                    {formatToken(position.amountUsd)}
                  </Text>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      <Divider my={1} />
      <TableContainer key='borrowTable' paddingBottom={2}>
        <Table size='sm'>
          <Thead>
            <Tr>
              <Th w={200}>
                <Text color='secondary' variant='caption'>
                  Assets borrowed
                </Text>
              </Th>
              <Th>
                <Text color='secondary' variant='caption' textAlign='right'>
                  Balance
                </Text>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {selectedObligation?.borrows.map((position) => (
              <Tr
                cursor='pointer'
                key={position.reserveAddress}
                onClick={() => {
                  // repay
                  setSelectedModalTab(3);
                  setSelectedReserve(position.reserveAddress);
                }}
              >
                <Td>
                  <Text>{position.symbol}</Text>
                  <Text color='secondary' variant='label'>
                    {position.price ? formatUsd(position.price?.toString()) : 0}
                  </Text>
                </Td>
                <Td isNumeric>
                  <Text>{formatToken(position.amount)}</Text>
                  <Text color='secondary' variant='label'>
                    {formatToken(position.amountUsd)}
                  </Text>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      <Divider my={1} />
      <Wallet />
    </Card>
  );
}
