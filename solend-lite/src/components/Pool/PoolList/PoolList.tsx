import { Flex, List, ListItem, Text } from '@chakra-ui/react';
import { useAtom } from 'jotai';
import { selectedPoolAtom } from 'stores/pools';
import { formatPercent, formatToken, formatUsd } from 'utils/numberFormatter';
import Token from 'components/Token/Token';
import Metric from 'components/Metric/Metric';

export default function PoolList({
  selectReserveWithModal,
}: {
  selectReserveWithModal: (reserve: string) => void;
}) {
  const [selectedPool] = useAtom(selectedPoolAtom);

  return (
    <List spacing={3}>
      {selectedPool?.reserves.map((reserve) => (
        <ListItem
          key={reserve.address}
          onClick={() => selectReserveWithModal(reserve.address)}
          cursor='pointer'
        >
          <Flex align='center' justify='space-between'>
            <Flex align='center' justify='center' flex={1} direction='column'>
              <Token size={32} reserve={reserve} />
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
              <Text variant='caption' color='secondary'>
                {formatUsd(reserve.price)}
              </Text>
            </Flex>
            <Flex w='60%' direction='column'>
              <Metric
                label='LTV'
                value={formatPercent(reserve.loanToValueRatio)}
                row
              />
              <Metric
                label='Total supply'
                value={formatToken(reserve.totalSupply)}
                row
              />
              <Metric
                label='Supply APR'
                value={formatPercent(reserve.supplyInterest)}
                row
              />
              <Metric
                label='Total borrow'
                value={formatToken(reserve.totalBorrow)}
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
    </List>
  );
}
