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
import { switchboardAtom } from 'stores/settings';

export default function Pool({
  selectReserveWithModal,
}: {
  selectReserveWithModal: (reserve: string) => void;
}) {
  const queryParams = new URLSearchParams(window.location.search);
  const poolParam = queryParams.get('pool');
  const [switchboardProgram] = useAtom(switchboardAtom);
  const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom);
  const [selectedPoolState] = useAtom(selectedPoolStateAtom);
  const [pools] = useAtom(poolsAtom);
  const [isLargerThan800] = useMediaQuery('(min-width: 800px)');

  const defaultPool = poolParam ?? Object.values(pools)[0].address;

  useEffect(() => {
    if (!switchboardProgram) return;
    setSelectedPool(defaultPool);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setSelectedPool, switchboardProgram]);

  if (selectedPoolState === 'loading') return <Loading />;

  const totalSupplyUsd =
    selectedPool?.reserves.reduce(
      (arr, r) => r.totalSupplyUsd.plus(arr),
      BigNumber(0),
    ) ?? new BigNumber(0);
  const totalBorrowUsd =
    selectedPool?.reserves.reduce(
      (arr, r) => r.totalBorrowUsd.plus(arr),
      BigNumber(0),
    ) ?? new BigNumber(0);
  const totalAvailableUsd =
    selectedPool?.reserves.reduce(
      (arr, r) => r.availableAmountUsd.plus(arr),
      BigNumber(0),
    ) ?? new BigNumber(0);

  return (
    <Box px={isLargerThan800 ? 8 : 4} py={isLargerThan800 ? 8 : 4}>
      <Box mb={8}>
        <Text variant='headline'>
          {selectedPool?.name ? `${selectedPool.name} Pool` : 'Pool overview'}
        </Text>
        <Divider my={1} />
        <Flex px={4} w='100%' justify='space-between'>
          <Metric
            label='Total supply'
            alignCenter
            value={`$${formatCompact(totalSupplyUsd)}`}
          />
          <Metric
            label='Total borrow'
            alignCenter
            value={`$${formatCompact(totalBorrowUsd)}`}
          />
          <Metric
            label='TVL'
            alignCenter
            value={`$${formatCompact(totalAvailableUsd)}`}
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
