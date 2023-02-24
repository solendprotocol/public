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
  Divider,
} from '@chakra-ui/react';
import { useAtom } from 'jotai';
import { selectedPoolAtom } from 'stores/pools';
import { formatPercent, formatToken, formatUsd } from 'utils/numberFormatter';
import Token from 'components/Token/Token';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';

export default function PoolTable({
  selectReserveWithModal,
}: {
  selectReserveWithModal: (reserve: string) => void;
}) {
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [showDisabled, setShowDisabled] = useState(false);
  const reserves = showDisabled
    ? selectedPool.reserves
    : selectedPool.reserves.filter((r) => !r.disabled);
  const sortedReserves = reserves.sort((a, b) => {
    return a.totalSupply.isGreaterThan(b.totalSupply) ? -1 : 1;
  });

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
            <Th isNumeric>
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
          {sortedReserves.map((reserve) => (
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
                <Text>{formatPercent(reserve.loanToValueRatio, false, 0)}</Text>
              </Td>
              <Td isNumeric>
                <Text>
                  {formatToken(reserve.totalSupply)} {reserve.symbol}
                </Text>
                <Text color='secondary' variant='label'>
                  {formatUsd(reserve.totalSupplyUsd)}
                </Text>
              </Td>
              <Td isNumeric>
                <Text>{formatPercent(reserve.supplyInterest)}</Text>
              </Td>
              <Td isNumeric>
                <Text>
                  {formatToken(reserve.totalBorrow)} {reserve.symbol}
                </Text>
                <Text color='secondary' variant='label'>
                  {formatUsd(reserve.totalBorrowUsd)}
                </Text>
              </Td>
              <Td isNumeric>
                <Text>{formatPercent(reserve.borrowInterest)}</Text>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {selectedPool.reserves.some((r) => r.disabled) && (
        <Box
          role='presentation'
          cursor='pointer'
          onKeyDown={() => setShowDisabled(!showDisabled)}
          mt={2}
          onClick={() => setShowDisabled(!showDisabled)}
        >
          <Divider mb='-22px' pt='12px' />
          <Flex justify='center' my='8px'>
            <Text color='secondary' bg='neutral' zIndex={1} px={2}>
              {showDisabled ? 'Hide deprecated ' : 'Show deprecated '}
              {showDisabled ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </Text>
          </Flex>
        </Box>
      )}
    </TableContainer>
  );
}
