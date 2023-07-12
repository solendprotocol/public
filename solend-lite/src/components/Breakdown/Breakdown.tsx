import React, { ReactElement } from 'react';
import {
  collapsableUsd,
  collapsableToken,
  formatToken,
} from 'utils/numberFormatter';
import classNames from 'classnames';
import styles from './Breakdown.module.scss';
import { Box, Flex, Text } from '@chakra-ui/react';
import { useAtom } from 'jotai';
import { selectedObligationAtom } from 'stores/obligations';
import { selectedPoolAtom } from 'stores/pools';
import { U64_MAX } from '@solendprotocol/solend-sdk';
import BigNumber from 'bignumber.js';
import { InfoOutlineIcon } from '@chakra-ui/icons';

const LONG_COL_SPAN = 70;
const SHORT_COL_SPAN = 50;

function BreakdownHeader({ weightLabel }: { weightLabel: string }) {
  return (
    <Flex justify='space-between' style={{ width: '100%' }}>
      <Box
        style={{
          textAlign: 'right',
        }}
        width={LONG_COL_SPAN}
      >
        <Text variant='label' color='secondary'>
          Position
        </Text>
      </Box>
      <Box
        style={{
          textAlign: 'right',
          position: 'absolute',
          left: 111,
        }}
      >
        <Text variant='label' color='secondary'>
          x
        </Text>
      </Box>
      <Box
        width={SHORT_COL_SPAN}
        style={{
          textAlign: 'right',
        }}
      >
        <Text variant='label' color='secondary'>
          Price
        </Text>
      </Box>
      <Box
        style={{
          textAlign: 'right',
          position: 'absolute',
          right: 164,
        }}
      >
        <Text variant='label' color='secondary'>
          x
        </Text>
      </Box>
      <Box
        width={LONG_COL_SPAN}
        style={{
          textAlign: 'right',
        }}
      >
        <Text variant='label' color='secondary'>
          {weightLabel}
        </Text>
      </Box>
      <Box
        style={{
          textAlign: 'right',
          position: 'absolute',
          right: 80,
        }}
      >
        <Text variant='label' color='secondary'>
          =
        </Text>
      </Box>
      <Box
        width={LONG_COL_SPAN}
        style={{
          textAlign: 'right',
        }}
      >
        <Text variant='label' color='secondary'>
          Total
        </Text>
      </Box>
    </Flex>
  );
}

function Breakdown({
  visible,
  setShowBorrowLimitTooltip,
  setShowWeightedBorrowTooltip,
  setShowLiquidationThresholdTooltip,
}: {
  visible: boolean;
  setShowBorrowLimitTooltip: (arg: boolean) => void;
  setShowWeightedBorrowTooltip: (arg: boolean) => void;
  setShowLiquidationThresholdTooltip: (arg: boolean) => void;
}): ReactElement {
  const [selectedObligation] = useAtom(selectedObligationAtom);
  const [pool] = useAtom(selectedPoolAtom);

  const supplyData =
    selectedObligation?.deposits.filter((d) => !d.amount.eq(0)) ?? [];
  const borrowData =
    selectedObligation?.borrows.filter((b) => !b.amount.eq(0)) ?? [];

  return (
    <Flex
      justify='space-between'
      direction='column'
      className={classNames(
        styles.params,
        visible ? styles.visible : styles.hidden,
      )}
      style={{
        maxHeight: visible ? 500 : 0,
        display: visible ? 'visible' : 'hidden',
      }}
    >
      <Box>
        <Flex
          justify='center'
          alignItems='center'
          backgroundColor='neutralAlt'
          zIndex={1}
          className={styles.tooltipTitle}
          onMouseEnter={() => setShowWeightedBorrowTooltip(true)}
          onMouseLeave={() => setShowWeightedBorrowTooltip(false)}
        >
          <Text color='brandAlt' mt='-3px' mr={1}>
            ■
          </Text>{' '}
          <Text variant='label' color='secondary'>
            Weighted borrow <InfoOutlineIcon fontSize={8} />
          </Text>
        </Flex>
      </Box>
      <BreakdownHeader weightLabel='Weight' />
      {Boolean(borrowData.length) &&
        borrowData.map((d) => {
          const reserve = pool?.reserves.find(
            (r) => r.address === d.reserveAddress,
          );

          return (
            <Text
              key={d.reserveAddress}
              variant='caption'
              color='secondary'
              style={{ width: '100%' }}
            >
              <Flex justify='space-between' style={{ width: '100%' }}>
                <Box
                  style={{
                    textAlign: 'right',
                  }}
                  width={LONG_COL_SPAN}
                >
                  {collapsableToken(d.amount.toString(), 2, 6)} {d.symbol}
                </Box>
                <Box
                  width={SHORT_COL_SPAN}
                  style={{
                    textAlign: 'right',
                  }}
                >
                  {collapsableUsd(d.price.toString(), 12)}
                </Box>
                <Box
                  width={SHORT_COL_SPAN}
                  style={{
                    textAlign: 'right',
                  }}
                >
                  {reserve?.addedBorrowWeightBPS.toString() !== U64_MAX &&
                  reserve?.borrowWeight
                    ? formatToken(
                        reserve?.borrowWeight?.toString(),
                        2,
                        false,
                        true,
                      )
                    : '∞'}
                </Box>
                <Box
                  width={LONG_COL_SPAN}
                  style={{
                    textAlign: 'right',
                  }}
                >
                  {new BigNumber(d.weightedAmountUsd).isGreaterThanOrEqualTo(
                    new BigNumber('1000000000'),
                  )
                    ? '∞'
                    : collapsableUsd(d.weightedAmountUsd.toString(), 10)}
                </Box>
              </Flex>
            </Text>
          );
        })}
      <Flex
        justify='end'
        style={{
          marginTop: 6,
          width: '100%',
        }}
      >
        <Box
          style={{
            textAlign: 'right',
            marginRight: 8,
          }}
        >
          <Text variant='caption' color='secondary'>
            Total weighted borrow:
          </Text>
        </Box>
        <Box
          style={{
            borderTop: '1px solid rgb(255,255,255, 0.12)',
          }}
        >
          <Text variant='caption' color='secondary'>
            {collapsableUsd(
              selectedObligation?.weightedTotalBorrowValue?.toString() ?? '0',
              10,
            )}
          </Text>
        </Box>
      </Flex>
      <Flex
        justify='center'
        alignItems='center'
        backgroundColor='neutralAlt'
        zIndex={1}
        className={styles.tooltipTitle}
        onMouseEnter={() => setShowBorrowLimitTooltip(true)}
        onMouseLeave={() => setShowBorrowLimitTooltip(false)}
      >
        <Text color='primary' mt='-3px' mr={1}>
          ■
        </Text>{' '}
        <Text variant='label' color='secondary'>
          Borrow limit <InfoOutlineIcon fontSize={8} />
        </Text>
      </Flex>
      <BreakdownHeader weightLabel='Open LTV' />
      {Boolean(supplyData.length) &&
        supplyData.map((d) => (
          <Text
            key={d.reserveAddress}
            variant='caption'
            color='secondary'
            style={{ width: '100%' }}
          >
            <Flex justify='space-between' style={{ width: '100%' }}>
              <Box
                style={{
                  textAlign: 'right',
                }}
                width={LONG_COL_SPAN}
              >
                {collapsableToken(d.amount.toString(), 2, 6)} {d.symbol}
              </Box>
              <Box
                width={SHORT_COL_SPAN}
                style={{
                  textAlign: 'right',
                }}
              >
                {collapsableUsd(d.price.toString(), 12)}
              </Box>
              <Box
                width={SHORT_COL_SPAN}
                style={{
                  textAlign: 'right',
                }}
              >
                {formatToken(d.loanToValueRatio, 2, false, true)}
              </Box>
              <Box
                width={LONG_COL_SPAN}
                style={{
                  textAlign: 'right',
                }}
              >
                <Text variant='caption' color='secondary'>
                  {collapsableUsd(
                    new BigNumber(d.amountUsd)
                      .times(new BigNumber(d.loanToValueRatio))
                      .toString(),
                    10,
                  )}
                </Text>
              </Box>
            </Flex>
          </Text>
        ))}
      <Flex
        justify='end'
        style={{
          marginTop: 6,
          width: '100%',
        }}
      >
        <Box
          style={{
            textAlign: 'right',
            marginRight: 8,
          }}
        >
          <Text variant='caption' color='secondary'>
            Total borrow limit:
          </Text>
        </Box>
        <Box
          style={{
            borderTop: '1px solid rgb(255,255,255, 0.12)',
          }}
        >
          <Text variant='caption' color='secondary'>
            {selectedObligation?.weightedTotalBorrowValue?.isGreaterThanOrEqualTo(
              new BigNumber('1000000000'),
            )
              ? '∞'
              : collapsableUsd(
                  selectedObligation?.borrowLimit?.toString() ?? '0',
                  10,
                )}
          </Text>
        </Box>
      </Flex>
      <Flex
        justify='center'
        alignItems='center'
        backgroundColor='neutralAlt'
        zIndex={1}
        className={styles.tooltipTitle}
        onMouseEnter={() => setShowLiquidationThresholdTooltip(true)}
        onMouseLeave={() => setShowLiquidationThresholdTooltip(false)}
      >
        <Text color='brand' mt='-3px' mr={1}>
          ■
        </Text>{' '}
        <Text variant='label' color='secondary'>
          Liquidation threshold <InfoOutlineIcon fontSize={8} />
        </Text>
      </Flex>
      <BreakdownHeader weightLabel='Close LTV' />
      {Boolean(supplyData.length) &&
        supplyData.map((d) => (
          <Text
            key={d.reserveAddress}
            variant='caption'
            color='secondary'
            style={{ width: '100%' }}
          >
            <Flex justify='space-between' style={{ width: '100%' }}>
              <Box
                style={{
                  textAlign: 'right',
                }}
                width={LONG_COL_SPAN}
              >
                {collapsableToken(d.amount.toString(), 2, 6)} {d.symbol}
              </Box>
              <Box
                width={SHORT_COL_SPAN}
                style={{
                  textAlign: 'right',
                }}
              >
                {collapsableUsd(d.price.toString(), 12)}
              </Box>
              <Box
                width={SHORT_COL_SPAN}
                style={{
                  textAlign: 'right',
                }}
              >
                {formatToken(d.liquidationThreshold, 2, false, true)}
              </Box>
              <Box
                style={{
                  textAlign: 'right',
                }}
                width={LONG_COL_SPAN}
              >
                <Text variant='caption' color='secondary'>
                  {collapsableUsd(
                    new BigNumber(d.amountUsd)
                      .times(new BigNumber(d.liquidationThreshold))
                      .toString(),
                    10,
                  )}
                </Text>
              </Box>
            </Flex>
          </Text>
        ))}
      <Flex
        justify='end'
        style={{
          marginTop: 6,
          width: '100%',
        }}
      >
        <Box
          style={{
            textAlign: 'right',
            marginRight: 8,
          }}
        >
          <Text variant='caption' color='secondary'>
            Total liquidation threshold:
          </Text>
        </Box>
        <Box
          style={{
            borderTop: '1px solid rgb(255,255,255, 0.12)',
          }}
        >
          <Text variant='caption' color='secondary'>
            {collapsableUsd(
              selectedObligation?.liquidationThreshold?.toString() ?? '0',
              10,
            )}
          </Text>
        </Box>
      </Flex>
    </Flex>
  );
}

export default Breakdown;
