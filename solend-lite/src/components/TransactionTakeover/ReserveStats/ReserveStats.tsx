import React, { ReactElement, useState } from 'react';
import { Box, Divider, Flex, Text, Tooltip } from '@chakra-ui/react';
import Metric from 'components/Metric/Metric';
import { formatPercent, formatToken, formatUsd } from 'utils/numberFormatter';
import { SelectedReserveType } from 'stores/pools';
import BigNumber from 'bignumber.js';
import styles from './ReserveStats.module.scss';
import classNames from 'classnames';
import { ChevronDownIcon, ChevronUpIcon, CopyIcon } from '@chakra-ui/icons';
import { computeExtremeRates } from '@solendprotocol/solend-sdk';

// certain oracles do not match their underlying asset, hence this mapping
const PYTH_ORACLE_MAPPING: Record<string, string> = {
  H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG: 'sol',
};

function getPythLink(feedAddress: string, assetName: string | null): string {
  if (!assetName) return '';
  if (feedAddress in PYTH_ORACLE_MAPPING) {
    return `https://pyth.network/price-feeds/crypto-${PYTH_ORACLE_MAPPING[
      feedAddress
    ].toLowerCase()}-usd`;
  }

  return `https://pyth.network/price-feeds/crypto-${assetName.toLowerCase()}-usd`;
}

type ReserveStatsPropsType = {
  reserve: SelectedReserveType;
  borrowLimit: BigNumber | null;
  newBorrowLimit: BigNumber | null;
  utilization: BigNumber | null;
  newBorrowUtilization: BigNumber | null;
  action: 'supply' | 'borrow' | 'withdraw' | 'repay';
  calculatedBorrowFee: BigNumber | null;
};

function ReserveStats({
  reserve,
  borrowLimit,
  newBorrowLimit,
  utilization,
  newBorrowUtilization,
  action,
  calculatedBorrowFee,
}: ReserveStatsPropsType): ReactElement {
  const [showParams, setShowParams] = useState(false);
  let newBorrowLimitDisplay = null;
  if (newBorrowLimit) {
    const nbuObj = newBorrowLimit;
    if (nbuObj.isLessThan(0)) {
      newBorrowLimitDisplay = formatUsd(0);
    } else {
      newBorrowLimitDisplay = formatUsd(newBorrowLimit);
    }
  }

  let newUtilizationDisplay = null;
  if (newBorrowUtilization) {
    const nbuObj = newBorrowUtilization;
    if (nbuObj.isGreaterThanOrEqualTo(1)) {
      newUtilizationDisplay = (
        <Text ml={1} color='brand'>
          {formatPercent(1)}
        </Text>
      );
    } else if (nbuObj.isLessThan(0)) {
      newUtilizationDisplay = formatPercent(0);
    } else {
      newUtilizationDisplay = formatPercent(newBorrowUtilization);
    }
  }

  const interestType = ['supply', 'withdraw'].includes(action)
    ? 'Supply'
    : 'Borrow';

  return (
    <Flex flexDirection='column'>
      <Metric
        label='User borrow limit'
        row
        value={
          <>
            {formatUsd(borrowLimit ?? 0)}
            {newBorrowLimit && (
              <>
                {' \u2192 '}
                {newBorrowLimitDisplay}
              </>
            )}
          </>
        }
      />
      <Metric
        label='Utilization'
        row
        value={
          <Text display="flex">
            {formatPercent(utilization ?? 0)}
            {newBorrowUtilization && (
              <>
                {' \u2192 '}
                {newUtilizationDisplay}
              </>
            )}
          </Text>
        }
      />
      <Metric
        row
        label={`${interestType} APR`}
        value={formatPercent(reserve.supplyInterest)}
      />
      {action === 'borrow' && calculatedBorrowFee && (
        <Metric
          label='Borrow fee'
          row
          value={
            <>
              {formatToken(calculatedBorrowFee, 4, false, false, false, true)}{' '}
              {reserve.symbol}
            </>
          }
        />
      )}
      <Box
        role='presentation'
        className={styles.collapseButton}
        onKeyDown={() => setShowParams(!showParams)}
        onClick={() => setShowParams(!showParams)}
      >
        <Divider mb='-22px' pt='12px' />
        <Flex justify='center' my='8px'>
          <Text color='primary' bg='neutral' zIndex={1} px={2}>
            <u>More parameters</u>{' '}
            {showParams ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </Text>
        </Flex>
      </Box>
      <Flex
        flexDirection='column'
        justify='space-between'
        className={classNames(
          styles.params,
          showParams ? styles.visible : styles.hidden,
        )}
        style={{
          maxHeight: showParams ? 500 : 0,
          display: showParams ? 'visible' : 'hidden',
        }}
      >
        {reserve.reserveSupplyLimit && (
          <Metric
            row
            label='Max reserve deposit limit'
            value={formatToken(reserve.reserveSupplyLimit)}
            tooltip='To limit risk, total deposits are limited.'
          />
        )}
        {reserve.reserveBorrowLimit && (
          <Metric
            row
            label='Max reserve borrow limit'
            value={formatToken(reserve.reserveBorrowLimit)}
            tooltip='The total amount of borrows for this reserve is limited to this amount.'
          />
        )}
        <Metric
          row
          label='Loan to value (LTV ratio)'
          value={formatPercent(reserve.loanToValueRatio)}
          tooltip='Loan-to-value (LTV) is the ratio describing how much you can borrow against your collateral.'
        />
        <Metric
          row
          label='Liquidation threshold'
          value={formatPercent(reserve.liquidationThreshold)}
          tooltip='Collateralization ratio at which liquidation occurs.'
        />
        <Metric
          row
          label='Liquidation penalty'
          value={formatPercent(reserve.liquidationPenalty)}
        />
        <Metric
          row
          label='Borrow fee percentage'
          value={<>{formatPercent(reserve.borrowFee)}</>}
        />
        <Metric
          row
          label='Flash loan fee'
          value={<>{formatPercent(reserve.flashLoanFee)}</>}
        />
        <Metric
          row
          label='Host fee percentage'
          value={<>{formatPercent(reserve.hostFee)}</>}
        />
        <Metric
          row
          label='liquidation protocol fee'
          tooltip='The liquidation protocol fee is a percentage of the liquidation penalty that goes to the Solend DAO treasury to help cover bad debt.'
          value={<>{formatPercent(reserve.protocolLiquidationFee)}</>}
        />
        <Metric
          row
          label='Interest rate spread'
          tooltip='Interest rate spread is a percentage of the borrow interest rate. The fee percentage ranges depending on the asset.'
          value={<>{formatPercent(reserve.interestRateSpread)}</>}
        />
        <Metric
          row
          label='Max borrow APR'
          value={formatPercent(
            reserve.maxBorrowApr === reserve.targetBorrowApr
              ? computeExtremeRates(reserve.maxBorrowApr)
              : reserve.maxBorrowApr,
          )}
          tooltip='Maximum possible borrow APR.'
        />
        <Metric
          row
          label='Target borrow APR'
          value={formatPercent(
            reserve.maxBorrowApr === reserve.targetBorrowApr
              ? computeExtremeRates(reserve.targetBorrowApr)
              : reserve.targetBorrowApr,
          )}
          tooltip='When utilization is equal to the target utilization, borrow APR will be this value.'
        />
        <Metric
          row
          label='Target utilization'
          value={formatPercent(reserve.targetUtilization)}
          tooltip='When utilization goes above this value, interest rates are more sensitive to changes in utilization.'
        />
        <Metric
          row
          label='Current asset utilization'
          value={formatPercent(reserve.reserveUtilization)}
          tooltip={
            <>
              Percentage of the asset being lent out. Utilization determines
              interest rates via a function.{' '}
              <a
                href='https://docs.solend.fi/protocol/fees'
                target='_blank'
                rel='noreferrer'
              >
                <u>Learn more</u>
              </a>
              .
            </>
          }
        />
        <Metric
          row
          label='Reserve address'
          value={
            <Tooltip title={reserve.address}>
              <>
                <a
                  href={`https://solscan.io/account/${reserve.address}`}
                  target='_blank'
                  rel='noreferrer'
                >
                  <u className={styles.reserveAddress}>
                    {reserve.address.slice(0, 4)}...{reserve.address.slice(-4)}
                  </u>
                </a>{' '}
                <CopyIcon
                  onClick={() => {
                    navigator.clipboard.writeText(reserve.address);
                  }}
                />
              </>
            </Tooltip>
          }
        />
        {reserve.feeReceiverAddress && (
          <Metric
            row
            label='Fee receiver address'
            value={
              <Tooltip title={reserve.feeReceiverAddress}>
                <>
                  <a
                    href={`https://solscan.io/account/${reserve.feeReceiverAddress}`}
                    target='_blank'
                    rel='noreferrer'
                  >
                    <u className={styles.reserveAddress}>
                      {reserve.feeReceiverAddress.slice(0, 4)}...
                      {reserve.feeReceiverAddress.slice(-4)}
                    </u>
                  </a>{' '}
                  <CopyIcon
                    onClick={() => {
                      if (reserve.feeReceiverAddress) {
                        navigator.clipboard.writeText(
                          reserve.feeReceiverAddress,
                        );
                      }
                    }}
                  />
                </>
              </Tooltip>
            }
          />
        )}
        <Metric
          row
          label='Token mint'
          value={
            <Tooltip title={reserve.mintAddress}>
              <>
                <a
                  href={`https://solscan.io/account/${reserve.mintAddress}`}
                  target='_blank'
                  rel='noreferrer'
                >
                  <u className={styles.reserveAddress}>
                    {reserve.mintAddress.slice(0, 4)}...
                    {reserve.mintAddress.slice(-4)}
                  </u>
                </a>{' '}
                <CopyIcon
                  onClick={() => {
                    navigator.clipboard.writeText(reserve.mintAddress);
                  }}
                />
              </>
            </Tooltip>
          }
        />
        <Metric
          row
          label='cToken mint'
          value={
            <Tooltip title={reserve.cTokenMint}>
              <>
                <a
                  target='_blank'
                  rel='noreferrer'
                  href={`https://solscan.io/account/${reserve.cTokenMint}`}
                >
                  <u className={styles.reserveAddress}>
                    {reserve.cTokenMint.slice(0, 4)}...
                    {reserve.cTokenMint.slice(-4)}
                  </u>
                </a>{' '}
                <CopyIcon
                  onClick={() => {
                    navigator.clipboard.writeText(reserve.cTokenMint);
                  }}
                />
              </>
            </Tooltip>
          }
        />
        {reserve.pythOracle !==
          'nu11111111111111111111111111111111111111111' && (
          <Metric
            row
            label='Pyth Oracle'
            value={
              <Tooltip title={reserve.pythOracle}>
                <>
                  <a
                    target='_blank'
                    rel='noreferrer'
                    href={getPythLink(reserve.pythOracle, reserve.symbol)}
                  >
                    <u className={styles.reserveAddress}>
                      {reserve.pythOracle.slice(0, 4)}...
                      {reserve.pythOracle.slice(-4)}
                    </u>
                  </a>{' '}
                  <CopyIcon
                    onClick={() => {
                      navigator.clipboard.writeText(reserve.pythOracle);
                    }}
                  />
                </>
              </Tooltip>
            }
          />
        )}
        <Metric
          row
          label='Switchboard Oracle'
          value={
            <Tooltip title={reserve.switchboardOracle}>
              <>
                <a
                  target='_blank'
                  rel='noreferrer'
                  href={`https://switchboard.xyz/explorer/3/${reserve.switchboardOracle}`}
                >
                  <u className={styles.reserveAddress}>
                    {reserve.switchboardOracle.slice(0, 4)}...
                    {reserve.switchboardOracle.slice(-4)}
                  </u>
                </a>{' '}
                <CopyIcon
                  onClick={() => {
                    navigator.clipboard.writeText(reserve.switchboardOracle);
                  }}
                />
              </>
            </Tooltip>
          }
        />
      </Flex>
    </Flex>
  );
}

export default ReserveStats;
