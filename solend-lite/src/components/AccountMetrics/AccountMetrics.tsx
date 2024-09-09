import React, { ReactElement, useState } from 'react';
import { formatPercent, formatUsd } from 'utils/numberFormatter';
import Metric from 'components/Metric/Metric';
import { useAtom } from 'jotai';
import { Box, Divider, Flex, Text } from '@chakra-ui/react';
import UtilizationBar from 'components/UtilizationBar/UtilizationBar';
import { selectedObligationAtom } from 'stores/obligations';

import styles from './AccountMetrics.module.scss';
import Breakdown from 'components/Breakdown/Breakdown';

function AccountMetrics(): ReactElement {
  const [obligation] = useAtom(selectedObligationAtom);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showBorrowLimitTooltip, setShowBorrowLimitTooltip] = useState(false);
  const [showWeightedBorrowTooltip, setShowWeightedBorrowTooltip] =
    useState(false);
  const [showLiquidationThresholdTooltip, setShowLiquidationThresholdTooltip] =
    useState(false);

  return (
    <Box p={4} border='1px' mt={2}>
      <Flex justify='space-between' w='100%'>
        <Metric
          label='Net value'
          value={
            obligation ? formatUsd(obligation.netAccountValue.toString()) : '-'
          }
          tooltip='The value of your account calculated as (supply balance - borrow balance).'
        />
        <Metric
          label='Supply balance'
          value={
            obligation ? formatUsd(obligation.totalSupplyValue.toString()) : '-'
          }
          tooltip='Supply balance is the sum of all assets supplied. Increasing this value increases your borrow limit and liquidation threshold.'
        />
        <Metric
          label='Borrow balance'
          value={
            obligation ? formatUsd(obligation.totalBorrowValue.toString()) : '-'
          }
          tooltip='Borrow balance is the sum of all assets borrowed.'
        />
      </Flex>
      <Flex w='100%' justify='space-between' mt={2}>
        <Metric
          label='Weighted borrow'
          value={
            obligation
              ? formatUsd(obligation.weightedTotalBorrowValue.toString())
              : '-'
          }
          tooltip='Borrow balance is the sum of all assets borrowed.'
        />
        <Metric
          label='Borrow limit'
          value={
            obligation ? formatUsd(obligation.borrowLimit.toString()) : '-'
          }
          tooltip={
            <>
              Borrow limit is the maximum value you can borrow marked by the
              white bar. To increase this limit, you can supply more assets.
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
      </Flex>
      <UtilizationBar
        stateOpen
        onClick={() => setShowBreakdown(!showBreakdown)}
        showBorrowLimitTooltip={showBorrowLimitTooltip}
        showWeightedBorrowTooltip={showWeightedBorrowTooltip}
        showLiquidationThresholdTooltip={showLiquidationThresholdTooltip}
        showBreakdown={showBreakdown}
      />
      <Flex w='100%'>
        <Metric
          row
          flex={1}
          label='Liquidation threshold'
          value={
            obligation
              ? formatUsd(obligation.liquidationThreshold.toString())
              : '-'
          }
          tooltip={
            <>
              Liquidation threshold is the limit where your collateral will be
              eligible for liquidation. This is marked by the red bar. Lower
              your borrow utilization to minimize this risk.
              <br />
              <br />
              Each asset supplied increases your borrow limit by a percentage of
              its value.
              <br />
              <br />
              (Currently{' '}
              {obligation
                ? formatPercent(
                    obligation.liquidationThresholdFactor.toString(),
                  )
                : '-'}{' '}
              of supply balance)
            </>
          }
        />
      </Flex>

      {obligation?.positions === 0 ? null : (
        <Box
          role='presentation'
          className={styles.collapseButton}
          onKeyDown={() => setShowBreakdown(!showBreakdown)}
          onClick={() => setShowBreakdown(!showBreakdown)}
        >
          <Divider mb='-18px' pt='12px' />
          <Flex justify='center' my='8px'>
            <Text
              color='secondary'
              bg='neutral'
              variant='caption'
              zIndex={1}
              px={2}
            >
              {showBreakdown ? 'Hide' : 'Show'} breakdown
            </Text>
          </Flex>
        </Box>
      )}
      <Breakdown
        visible={showBreakdown}
        setShowBorrowLimitTooltip={setShowBorrowLimitTooltip}
        setShowWeightedBorrowTooltip={setShowWeightedBorrowTooltip}
        setShowLiquidationThresholdTooltip={setShowLiquidationThresholdTooltip}
      />
    </Box>
  );
}

export default AccountMetrics;
