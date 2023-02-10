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
import { useEffect } from 'react';
import {
  poolsAtom,
  selectedPoolAtom,
  selectedPoolStateAtom,
} from 'stores/pools';
import { formatPercent, formatToken, formatUsd } from 'utils/numberFormatter';
import Token from 'components/Token/Token';
import Metric from 'components/Metric/Metric';
import Loading from 'components/Loading/Loading';
import BigNumber from 'bignumber.js';

export default function Pool({
  selectReserveWithModal,
}: {
  selectReserveWithModal: (reserve: string) => void;
}) {
  const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);
  const [selectedPoolState] = useAtom(selectedPoolStateAtom);
  const [pools] = useAtom(poolsAtom);

  const firstPool = Object.values(pools)[0].address;
  const poolsExist = Object.keys(pools).length > 0;
  useEffect(() => {
    if (poolsExist) {
      setSelectedPool(firstPool);
    }
  }, [poolsExist, setSelectedPool, firstPool]);

  if (selectedPoolState === 'loading') return <Loading />;

  const totalSupply =
    selectedPool?.reserves.reduce(
      (arr, r) => r.totalSupplyUsd.plus(arr),
      BigNumber(0),
    ) ?? new BigNumber(0);
  const totalBorrow =
    selectedPool?.reserves.reduce(
      (arr, r) => r.totalBorrowUsd.plus(arr),
      BigNumber(0),
    ) ?? new BigNumber(0);
  const totalAvailable =
    selectedPool?.reserves.reduce(
      (arr, r) => r.availableAmountUsd.plus(arr),
      BigNumber(0),
    ) ?? new BigNumber(0);

  return (
    <Box px={8} py={8}>
      <Box mb={8}>
        <Text variant='headline'>Pool overview</Text>
        <Divider my={1} />
        <Flex px={4} w='100%' justify='space-between'>
          <Metric
            label='Total supply'
            alignCenter
            value={formatUsd(totalSupply)}
          />
          <Metric
            label='Total borrow'
            alignCenter
            value={formatUsd(totalBorrow)}
          />
          <Metric label='TVL' alignCenter value={formatUsd(totalAvailable)} />
        </Flex>
      </Box>

      <Box>
        <Text variant='headline'>Assets</Text>
        <Divider my={1} />
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
      </Box>
    </Box>
  );
}
