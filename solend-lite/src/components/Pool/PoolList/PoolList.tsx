import { Flex, List, ListItem, Text } from '@chakra-ui/react';
import { ReserveWithMetadataType } from 'stores/pools';
import {
  formatCompact,
  formatPercent,
  formatToken,
  formatUsd,
} from 'utils/numberFormatter';
import Token from 'components/Token/Token';
import Metric from 'components/Metric/Metric';
import {
  ASSET_BORROW_LIMIT_TOOLTIP,
  ASSET_SUPPLY_LIMIT_TOOLTIP,
} from '../Pool';

export default function PoolList({
  selectReserveWithModal,
  reserves,
}: {
  selectReserveWithModal: (reserve: string) => void;
  reserves: Array<ReserveWithMetadataType>;
}) {
  return (
    <List>
      {reserves.map((reserve) => {
        const atSupplyLimit =
          reserve.reserveSupplyCap.eq(0) ||
          reserve.totalSupply.isGreaterThanOrEqualTo(
            reserve.reserveSupplyCap.times(
              Math.min(0.9999, 1 - 1 / Number(reserve.reserveSupplyCap)),
            ),
          );

        const atBorrowLimit =
          reserve.reserveBorrowCap.eq(0) ||
          reserve.totalBorrow.isGreaterThanOrEqualTo(
            reserve.reserveBorrowCap.times(
              Math.min(0.9999, 1 - 1 / Number(reserve.reserveBorrowCap)),
            ),
          );

        return (
          <ListItem
            key={reserve.address}
            onClick={() => selectReserveWithModal(reserve.address)}
            cursor='pointer'
            borderBottom='1px'
            py={2}
          >
            <Flex align='center' justify='space-between'>
              <Flex align='center' justify='center' flex={1} direction='column'>
                <Token size={32} reserve={reserve} />
                <Text pt={2}>
                  {reserve.symbol ??
                    `${reserve.mintAddress.slice(
                      0,
                      4,
                    )}...${reserve.mintAddress.slice(
                      -4,
                      reserve.mintAddress.length - 1,
                    )}`}
                </Text>
                <Text variant='caption' color='secondary'>
                  {formatUsd(reserve.price)}
                </Text>
              </Flex>
              <Flex w='60%' direction='column'>
                <Metric
                  label='LTV'
                  value={formatPercent(reserve.loanToValueRatio, false, 0)}
                  row
                />
                <Metric
                  label='Total supply'
                  tooltip={
                    atSupplyLimit ? ASSET_SUPPLY_LIMIT_TOOLTIP : undefined
                  }
                  value={
                    <Text color={atSupplyLimit ? 'secondary' : undefined}>
                      {reserve.totalSupply.isGreaterThan(1000000)
                        ? formatCompact(reserve.totalSupply)
                        : formatToken(reserve.totalSupply, 2)}{' '}
                      {reserve.symbol}
                    </Text>
                  }
                  row
                />
                <Metric
                  label='Supply APR'
                  value={formatPercent(reserve.supplyInterest)}
                  row
                />
                <Metric
                  label='Total borrow'
                  tooltip={
                    atSupplyLimit ? ASSET_BORROW_LIMIT_TOOLTIP : undefined
                  }
                  value={
                    <Text color={atBorrowLimit ? 'secondary' : undefined}>
                      {reserve.totalBorrow.isGreaterThan(1000000)
                        ? formatCompact(reserve.totalBorrow)
                        : formatToken(reserve.totalBorrow, 2)}{' '}
                      {reserve.symbol}
                    </Text>
                  }
                  row
                />
                <Metric
                  label='Borrow APR'
                  value={formatPercent(reserve.borrowInterest)}
                  row
                />
              </Flex>
            </Flex>
          </ListItem>
        );
      })}
    </List>
  );
}
