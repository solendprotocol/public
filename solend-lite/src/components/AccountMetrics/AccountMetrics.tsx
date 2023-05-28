import React, { ReactElement } from 'react';
import { formatPercent, formatUsd } from 'utils/numberFormatter';
import Metric from 'components/Metric/Metric';
import { useAtom } from 'jotai';
import { Box, Flex, Spacer } from '@chakra-ui/react';
import UtilizationBar from 'components/UtilizationBar/UtilizationBar';
import { selectedObligationAtom } from 'stores/obligations';

function AccountMetrics(): ReactElement {
  const [obligation] = useAtom(selectedObligationAtom);

  return (
    <Box p={4} border='1px' mt={2}>
      <Flex>
        <Metric
          label='Net value'
          value={
            obligation
              ? `${formatUsd(obligation.netAccountValue.toString())}`
              : '-'
          }
          tooltip='The value of your account calculated as (supply balance - borrow balance).'
        />
        <Spacer />
        <Metric
          label='Borrow utilization'
          value={
            obligation
              ? formatPercent(obligation.borrowUtilization.toString())
              : '-'
          }
          tooltip='Borrow utilization is equal to your total borrowed amount, Boxided by the borrow limit. At 100%, you will not be able to borrow any more and will be close to liquidation.'
          dangerTooltip={
            obligation?.isBorrowLimitReached ? (
              <>
                You have reached your borrow limit and approaching the
                liquidation threshold of{' '}
                {formatPercent(
                  obligation.liquidationThresholdFactor.toString(),
                )}
                . To avoid liquidation, you can repay your positions or supply
                more assets
              </>
            ) : undefined
          }
        />
      </Flex>
      <Flex>
        <Metric
          label='Borrow balance'
          value={
            obligation
              ? `${formatUsd(obligation.totalBorrowValue.toString())}`
              : '-'
          }
          tooltip='Borrow balance is the sum of all assets borrowed.'
        />
        <Spacer />
        <Metric
          label='Supply balance'
          value={
            obligation
              ? `${formatUsd(obligation.totalSupplyValue.toString())}`
              : '-'
          }
          tooltip='Supply balance is the sum of all assets supplied. Increasing this value increases your borrow limit and liquidation threshold.'
        />
      </Flex>
      <UtilizationBar />
      <Metric
        row
        label='Borrow limit'
        value={
          obligation ? `${formatUsd(obligation.borrowLimit.toString())}` : '-'
        }
        tooltip={
          <>
            Borrow limit is the maximum value you can borrow marked by the white
            bar. To increase this limit, you can supply more assets.
            <br />
            <br />
            Each asset supplied increases your borrow limit by a percentage of
            its value.
            <br />
            <br />
            (Currently{' '}
            {obligation
              ? formatPercent(obligation.borrowLimitFactor.toString())
              : '-'}{' '}
            of supply balance).
          </>
        }
      />
      <Metric
        row
        label='Liquidation threshold'
        value={
          obligation
            ? `${formatUsd(obligation.liquidationThreshold.toString())}`
            : '-'
        }
        tooltip={
          <>
            Liquidation threshold is the limit where your collateral will be
            eligible for liquidation. This is marked by the red bar. Lower your
            borrow utilization to minimize this risk.
            <br />
            <br />
            Each asset supplied increases your borrow limit by a percentage of
            its value.
            <br />
            <br />
            (Currently{' '}
            {obligation
              ? formatPercent(obligation.liquidationThresholdFactor.toString())
              : '-'}{' '}
            of supply balance)
          </>
        }
      />
    </Box>
  );
}

export default AccountMetrics;
