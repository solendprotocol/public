import { Box, Divider, Flex, List, ListItem, Text } from '@chakra-ui/react';
import { useAtom } from 'jotai';
import { selectedPoolAtom } from 'stores/pools';
import {
  formatCompact,
  formatPercent,
  formatToken,
  formatUsd,
} from 'utils/numberFormatter';
import Token from 'components/Token/Token';
import Metric from 'components/Metric/Metric';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';

export default function PoolList({
  selectReserveWithModal,
}: {
  selectReserveWithModal: (reserve: string) => void;
}) {
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [showDisabled, setShowDisabled] = useState(false);
  const reserves = showDisabled
    ? selectedPool?.reserves
    : selectedPool?.reserves.filter((r) => !r.disabled);
  const sortedReserves =
    reserves?.sort((a, b) => {
      return a.totalSupplyUsd.isGreaterThan(b.totalSupplyUsd) ? -1 : 1;
    }) ?? [];

  return (
    <List>
      {sortedReserves.map((reserve) => (
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
                value={`${
                  reserve.totalSupply.isGreaterThan(1000000)
                    ? formatCompact(reserve.totalSupply)
                    : formatToken(reserve.totalSupply, 2)
                } ${reserve.symbol}`}
                row
              />
              <Metric
                label='Supply APR'
                value={formatPercent(reserve.supplyInterest)}
                row
              />
              <Metric
                label='Total borrow'
                value={`${
                  reserve.totalSupply.isGreaterThan(1000000)
                    ? formatCompact(reserve.totalBorrow)
                    : formatToken(reserve.totalBorrow, 2)
                } ${reserve.symbol}`}
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
      ))}
      {selectedPool?.reserves.some((r) => r.disabled) && (
        <Box
          role='presentation'
          cursor='pointer'
          mt={2}
          onKeyDown={() => setShowDisabled(!showDisabled)}
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
    </List>
  );
}
