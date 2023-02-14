import { Text, Flex, Box, Divider, useMediaQuery } from '@chakra-ui/react';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import {
  poolsAtom,
  selectedPoolAtom,
  selectedPoolStateAtom,
} from 'stores/pools';
import { formatCompact } from 'utils/numberFormatter';
import Metric from 'components/Metric/Metric';
import Loading from 'components/Loading/Loading';
import BigNumber from 'bignumber.js';
import PoolTable from './PoolTable/PoolTable';
import PoolList from './PoolList/PoolList';

export default function Pool({
  selectReserveWithModal,
}: {
  selectReserveWithModal: (reserve: string) => void;
}) {
  const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);
  const [selectedPoolState] = useAtom(selectedPoolStateAtom);
  const [pools] = useAtom(poolsAtom);
  const [isLargerThan800] = useMediaQuery('(min-width: 800px)');

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
    <Box px={isLargerThan800 ? 8 : 4} py={isLargerThan800 ? 8 : 4}>
      <Box mb={8}>
        <Text variant='headline'>Pool overview</Text>
        <Divider my={1} />
        <Flex px={4} w='100%' justify='space-between'>
          <Metric
            label='Total supply'
            alignCenter
            value={formatCompact(totalSupply)}
          />
          <Metric
            label='Total borrow'
            alignCenter
            value={formatCompact(totalBorrow)}
          />
          <Metric
            label='TVL'
            alignCenter
            value={formatCompact(totalAvailable)}
          />
        </Flex>
      </Box>

      <Box>
        <Text variant='headline'>Assets</Text>
        <Divider my={1} />
        {isLargerThan800 ? (
          <PoolTable selectReserveWithModal={selectReserveWithModal} />
        ) : (
          <PoolList selectReserveWithModal={selectReserveWithModal} />
        )}
      </Box>
    </Box>
  );
}
