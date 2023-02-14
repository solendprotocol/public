import {
  Text,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Flex,
  Box,
} from '@chakra-ui/react';
import { useAtom } from 'jotai';
import { selectedPoolAtom } from 'stores/pools';
import { formatPercent, formatToken, formatUsd } from 'utils/numberFormatter';
import Token from 'components/Token/Token';

export default function PoolTable({
  selectReserveWithModal,
}: {
  selectReserveWithModal: (reserve: string) => void;
}) {
  const [selectedPool] = useAtom(selectedPoolAtom);

  return (
    <TableContainer>
      <Table size='sm'>
        <Thead>
          <Tr>
            <Th>
              <Text color='secondary' variant='caption'>
                Asset name
              </Text>
            </Th>
            <Th>
              <Text color='secondary' variant='caption'>
                LTV
              </Text>
            </Th>
            <Th isNumeric>
              <Text color='secondary' variant='caption'>
                Total supply
              </Text>
            </Th>
            <Th isNumeric>
              <Text color='secondary' variant='caption'>
                Supply APR
              </Text>
            </Th>
            <Th isNumeric>
              <Text color='secondary' variant='caption'>
                Total borrow
              </Text>
            </Th>
            <Th isNumeric>
              <Text color='secondary' variant='caption'>
                Borrow APR
              </Text>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {selectedPool?.reserves.map((reserve) => (
            <Tr
              key={reserve.address}
              onClick={() => selectReserveWithModal(reserve.address)}
              cursor='pointer'
            >
              <Td>
                <Flex align='center'>
                  <Token size={32} reserve={reserve} />
                  <Box ml={4}>
                    <Text>
                      {reserve.symbol ??
                        `${reserve.mintAddress.slice(
                          0,
                          4,
                        )}...${reserve.mintAddress.slice(
                          -4,
                          reserve.mintAddress.length - 1,
                        )}`}
                    </Text>
                    <Text color='secondary' variant='label'>
                      {formatUsd(reserve.price)}
                    </Text>
                  </Box>
                </Flex>
              </Td>
              <Td isNumeric>
                <Text>{formatPercent(reserve.loanToValueRatio)}</Text>
              </Td>
              <Td isNumeric>
                <Text>{formatToken(reserve.totalSupply)}</Text>
                <Text color='secondary' variant='label'>
                  {formatToken(reserve.totalSupplyUsd)}
                </Text>
              </Td>
              <Td isNumeric>
                <Text>{formatPercent(reserve.supplyInterest)}</Text>
              </Td>
              <Td isNumeric>
                <Text>{formatToken(reserve.totalBorrow)}</Text>
                <Text color='secondary' variant='label'>
                  {formatToken(reserve.totalBorrowUsd)}
                </Text>
              </Td>
              <Td isNumeric>
                <Text>{formatPercent(reserve.borrowInterest)}</Text>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
