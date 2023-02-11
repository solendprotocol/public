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
} from '@chakra-ui/react';
import AccountMetrics from 'components/AccountMetrics/AccountMetrics';
import Wallet from 'components/Wallet/Wallet';
import { useAtom, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { selectedObligationAtom } from 'stores/obligations';
import { selectedReserveAtom } from 'stores/pools';
import { formatToken, formatUsd } from 'utils/numberFormatter';

export default function Account() {
  const [changed, setChanged] = useState<boolean>(false);
  const [newObligationAddress, setNewObligationAddress] = useState<string>('');
  const [selectedObligation, setSelectedObligation] = useAtom(
    selectedObligationAtom,
  );
  const setSelectedReserve = useSetAtom(selectedReserveAtom);
  useEffect(() => {
    if (selectedObligation?.address?.length && changed) {
      setNewObligationAddress(selectedObligation?.address ?? '');
    }
  }, [selectedObligation?.address, changed]);

  console.log(selectedObligation);
  return (
    <Card m={8} p={2} border='1px solid'>
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
            setSelectedObligation({
              newSelectedObligationAddress: newObligationAddress,
            });
          }
        }}
      />
      <AccountMetrics />
      <Center mt={4}></Center>
      <Divider my={1} />
      <TableContainer key='supplyTable'>
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
                onClick={() => setSelectedReserve(position.reserveAddress)}
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
      <TableContainer key='borrowTable'>
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
                onClick={() => setSelectedReserve(position.reserveAddress)}
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
