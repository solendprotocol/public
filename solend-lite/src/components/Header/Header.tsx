import { Flex, Box, useMediaQuery } from '@chakra-ui/react';
import Logo from 'components/Logo/Logo';
import RpcSwitcher from 'components/RpcSwitcher/RpcSwitcher';
import { useAtom } from 'jotai';
import { obligationsAtom } from 'stores/obligations';
import { poolsAtom } from 'stores/pools';
import ConnectButton from 'components/ConnectButton/ConnectButton';
import Metric from 'components/Metric/Metric';
import BigNumber from 'bignumber.js';
import { formatCompact, formatUsd } from 'utils/numberFormatter';
import RefreshDataButton from 'components/RefreshDataButton/RefreshDataButton';

import styles from './Header.module.scss';
import { HamburgerIcon } from '@chakra-ui/icons';

export default function Header({
  openNav,
  openAccount,
}: {
  openNav?: () => void;
  openAccount?: () => void;
}) {
  const [pools] = useAtom(poolsAtom);
  const [obligations] = useAtom(obligationsAtom);
  const [isLargerThan800] = useMediaQuery('(min-width: 800px)');

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

  const yourSupply = obligations.reduce(
    (acc, o) => o.totalSupplyValue.plus(acc),
    new BigNumber(0),
  );
  const yourBorrow = obligations.reduce(
    (acc, o) => o.totalBorrowValue.plus(acc),
    new BigNumber(0),
  );
  const yourPositions = obligations.reduce(
    (acc, o) => new BigNumber(o.deposits.length + o.borrows.length).plus(acc),
    new BigNumber(0),
  );

  return (
    <Flex
      h='100%'
      align='center'
      justify='space-between'
      className={styles.headerBanner}
      px={isLargerThan800 ? undefined : 4}
    >
      {!isLargerThan800 && openNav ? (
        <Box>
          <HamburgerIcon
            color='primary'
            onClick={() => openNav()}
            cursor='pointer'
          />
        </Box>
      ) : null}
      <Box pl={isLargerThan800 ? 8 : 0} w={isLargerThan800 ? 200 : undefined}>
        <Logo />
      </Box>
      {isLargerThan800 && (
        <Flex px={4} flex='1'>
          <Flex w='100%' justify='space-around' p={1}>
            <Metric
              label='Total supply'
              value={`$${formatCompact(totalSupplyUsd)}`}
              alignCenter
            />
            <Metric
              label='Total borrow'
              value={`$${formatCompact(totalBorrowUsd)}`}
              alignCenter
            />
            <Metric
              label='Solend TVL'
              value={`$${formatCompact(totalAvailableUsd)}`}
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
      )}
      <Flex justify='end' w={isLargerThan800 ? 400 : undefined} align='center'>
        {isLargerThan800 ? <RpcSwitcher /> : null}
        <ConnectButton openAccount={openAccount} />
        <RefreshDataButton />
      </Flex>
    </Flex>
  );
}
