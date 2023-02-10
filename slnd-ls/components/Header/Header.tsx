import { Flex, Box } from '@chakra-ui/react';
import Logo from 'components/Logo/Logo';
import RpcSwitcher from 'components/RpcSwitcher/RpcSwitcher';
import { useAtom, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { obligationsAtom } from 'stores/obligations';
import { loadPoolsAtom, poolsAtom } from 'stores/pools';
import ConnectButton from 'components/ConnectButton/ConnectButton';
import Metric from 'components/Metric/Metric';
import BigNumber from 'bignumber.js';
import { formatCompact, formatUsd } from 'utils/numberFormatter';
import RefreshDataButton from 'components/RefreshDataButton/RefreshDataButton';

import styles from './Header.module.scss';

export default function Header() {
  const [pools] = useAtom(poolsAtom);
  const [obligations] = useAtom(obligationsAtom);
  const loadPools = useSetAtom(loadPoolsAtom);

  const poolsExist = Boolean(Object.keys(pools).length > 0);
  useEffect(() => {
    if (poolsExist) {
      loadPools();
    }
  }, [poolsExist, loadPools]);

  const totalSupplyUsd = Object.values(pools).reduce(
    (acc, p) =>
      p.reserves
        .reduce((subAcc, r) => r.totalSupplyUsd.plus(subAcc), new BigNumber(0))
        .plus(acc),
    new BigNumber(0),
  );
  const totalBorrowUsd = Object.values(pools).reduce(
    (acc, p) =>
      p.reserves
        .reduce((subAcc, r) => r.totalBorrowUsd.plus(subAcc), new BigNumber(0))
        .plus(acc),
    new BigNumber(0),
  );
  const totalAvailableUsd = Object.values(pools).reduce(
    (acc, p) =>
      p.reserves
        .reduce(
          (subAcc, r) => r.availableAmountUsd.plus(subAcc),
          new BigNumber(0),
        )
        .plus(acc),
    new BigNumber(0),
  );

  const yourSupply = Object.values(obligations).reduce(
    (acc, o) => o.totalSupplyValue.plus(acc),
    new BigNumber(0),
  );
  const yourBorrow = Object.values(obligations).reduce(
    (acc, o) => o.totalBorrowValue.plus(acc),
    new BigNumber(0),
  );
  const yourPositions = Object.values(obligations).reduce(
    (acc, o) => new BigNumber(o.deposits.length + o.borrows.length).plus(acc),
    new BigNumber(0),
  );

  return (
    <Flex
      h='100%'
      align='center'
      justify='space-between'
      className={styles.headerBanner}
    >
      <Box pl={8} w={200}>
        <Logo />
      </Box>
      <Flex px={4} flex='1'>
        <Flex w='100%' justify='space-around' p={1}>
          <Metric
            label='Total supply'
            value={formatCompact(totalSupplyUsd)}
            alignCenter
          />
          <Metric
            label='Total borrow'
            value={formatCompact(totalBorrowUsd)}
            alignCenter
          />
          <Metric
            label='Solend TVL'
            value={formatCompact(totalAvailableUsd)}
            alignCenter
          />
          <Metric
            label='Your supply'
            value={formatUsd(yourSupply)}
            alignCenter
          />
          <Metric
            label='Your borrow'
            value={formatUsd(yourBorrow)}
            alignCenter
          />
          <Metric
            label='Positions'
            value={yourPositions.toString()}
            alignCenter
          />
        </Flex>
      </Flex>
      <Flex justify='end' w={400} align='center'>
        <ConnectButton />
        <RpcSwitcher />
        <RefreshDataButton />
      </Flex>
    </Flex>
  );
}
