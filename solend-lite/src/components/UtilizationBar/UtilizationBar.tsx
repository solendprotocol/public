import React, { ReactElement, useEffect, useState } from 'react';
import classNames from 'classnames';
import { Tooltip } from '@chakra-ui/react';
import { formatPercent, formatUsd } from 'utils/numberFormatter';
import { useAtom } from 'jotai';
import { selectedObligationAtom } from 'stores/obligations';
import BigNumber from 'bignumber.js';

import styles from './UtilizationBar.module.scss';

Section.defaultProps = {
  width: 1.5,
  extraClassName: null,
  tooltip: null,
};

function Section({
  width = 1.5,
  extraClassName,
  tooltip,
  open,
  stateOpen,
}: {
  width?: number;
  extraClassName?: string;
  tooltip?: string;
  open?: boolean;
  stateOpen?: boolean;
}) {
  const [openState, setOpenState] = useState<boolean | undefined>(open);
  useEffect(() => {
    if (openState === false) {
      setOpenState(undefined);
    }
  }, [openState]);

  useEffect(() => {
    setOpenState(open);
  }, [open]);

  return (
    <Tooltip
      className={openState ? styles.open : undefined}
      label={tooltip}
      hasArrow
      isOpen={stateOpen ? openState : undefined}
    >
      <div
        style={{
          width: `${width}%`,
        }}
        className={classNames(styles.section, extraClassName)}
      />
    </Tooltip>
  );
}

function UtilizationBar({
  onClick,
  showBorrowLimitTooltip,
  showWeightedBorrowTooltip,
  showLiquidationThresholdTooltip,
  showBreakdown,
  stateOpen,
}: {
  onClick: () => void;
  showBorrowLimitTooltip: boolean;
  showWeightedBorrowTooltip: boolean;
  showLiquidationThresholdTooltip: boolean;
  showBreakdown: boolean;
  stateOpen: boolean;
}): ReactElement {
  const [obligation] = useAtom(selectedObligationAtom);

  const usedObligation = obligation ?? {
    totalSupplyValue: new BigNumber(0),
    totalBorrowValue: new BigNumber(0),
    borrowLimit: new BigNumber(0),
    liquidationThreshold: new BigNumber(0),
    borrowOverSupply: new BigNumber(0),
    borrowLimitOverSupply: new BigNumber(0),
    liquidationThresholdFactor: new BigNumber(0),
    weightedTotalBorrowValue: new BigNumber(0),
    weightedBorrowUtilization: new BigNumber(0),
  };

  const borrowLimitOverSupply = usedObligation.totalSupplyValue.isZero()
    ? new BigNumber(0)
    : usedObligation.borrowLimit.dividedBy(usedObligation.totalSupplyValue);

  const weightedBorrowOverSupply = usedObligation.totalSupplyValue.isZero()
    ? new BigNumber(0)
    : usedObligation.weightedTotalBorrowValue.dividedBy(
        usedObligation.totalSupplyValue,
      );

  const passedLimit =
    usedObligation.totalSupplyValue.isZero() ||
    (!usedObligation.weightedTotalBorrowValue.isZero() &&
      usedObligation.weightedTotalBorrowValue.isGreaterThanOrEqualTo(
        usedObligation.borrowLimit,
      ));

  const passedThreshold =
    usedObligation.totalSupplyValue.isZero() ||
    (!usedObligation.weightedTotalBorrowValue.isZero() &&
      usedObligation.weightedTotalBorrowValue.isGreaterThanOrEqualTo(
        usedObligation.liquidationThreshold,
      ));
  // 3% reserved for the bars
  const denominator =
    97 + (passedLimit ? 1.5 : 0) + (passedThreshold ? 1.5 : 0);

  const borrowWidth = Math.min(
    100,
    Number(Number(usedObligation.borrowOverSupply.toString()).toFixed(4)) *
      denominator,
  );

  const liquidationThresholdFactor = usedObligation.totalSupplyValue.isZero()
    ? BigNumber(0)
    : usedObligation.liquidationThreshold.dividedBy(
        usedObligation.totalSupplyValue,
      );

  const weightedBorrowWidth =
    Math.min(
      100,
      Number(Number(weightedBorrowOverSupply.toString()).toFixed(4)) *
        denominator,
    ) - borrowWidth;

  const totalBorrowWidth = borrowWidth + weightedBorrowWidth;

  const unborrowedWidth =
    Number(
      Number(
        usedObligation.totalSupplyValue.isZero()
          ? BigNumber(0)
          : BigNumber.max(
              usedObligation.borrowLimit.minus(
                usedObligation.weightedTotalBorrowValue,
              ),
              BigNumber(0),
            )
              .dividedBy(usedObligation.totalSupplyValue)
              .toString(),
      ).toFixed(4),
    ) * denominator;
  const unliquidatedWidth =
    Number(
      Number(
        usedObligation.totalSupplyValue.isZero()
          ? BigNumber(0)
          : BigNumber.max(
              usedObligation.liquidationThreshold.minus(
                BigNumber.max(
                  usedObligation.borrowLimit,
                  usedObligation.weightedTotalBorrowValue,
                ),
              ),
              BigNumber(0),
            )
              .dividedBy(usedObligation.totalSupplyValue)
              .toString(),
      ).toFixed(4),
    ) * denominator;
  const unusedSupply =
    denominator - totalBorrowWidth - unborrowedWidth - unliquidatedWidth;

  let borrowToolTip = `Your weighted borrow balance is ${formatPercent(
    weightedBorrowOverSupply.toString(),
  )} of your total supply, or ${formatPercent(
    usedObligation.weightedBorrowUtilization.toString(),
  )} of your borrow limit.`;

  if (passedLimit) {
    borrowToolTip =
      'Your weighted borrow balance is past the borrow limit and could be at risk of liquidation. Please repay your borrows or supply more assets.';
  }

  if (passedThreshold) {
    borrowToolTip =
      'Your weighted borrow balance is past the liquidation threshold and could be liquidated.';
  }

  const unweightedBorrowTooltip = `This portion represents the actual value of your borrows. However, certain assets have a borrow weight that changes their value during liquidation or borrow limit calculations.`;

  return (
    <div className={styles.container} onClick={onClick} aria-hidden='true'>
      {showBreakdown && (
        <Section
          width={borrowWidth}
          extraClassName={passedLimit ? styles.overBorrowed : styles.borrowed2}
          tooltip={
            showWeightedBorrowTooltip ? undefined : unweightedBorrowTooltip
          }
        />
      )}
      {showBreakdown && (
        <Section
          width={weightedBorrowWidth}
          open={showWeightedBorrowTooltip}
          stateOpen={stateOpen}
          extraClassName={passedLimit ? styles.overBorrowed : styles.borrowed}
          tooltip={borrowToolTip}
        />
      )}
      {!showBreakdown && (
        <Section
          width={totalBorrowWidth}
          open={showWeightedBorrowTooltip}
          stateOpen={stateOpen}
          extraClassName={passedLimit ? styles.overBorrowed : styles.borrowed}
          tooltip={borrowToolTip}
        />
      )}
      {!passedLimit && (
        <Section
          width={unborrowedWidth}
          tooltip={`You can borrow ${formatUsd(
            usedObligation.borrowLimit
              .minus(usedObligation.weightedTotalBorrowValue)
              .toString(),
          )} more (weighted) borrow value before you hit your limit.`}
        />
      )}
      {!passedLimit && (
        <Section
          extraClassName={styles.limitBar}
          open={showBorrowLimitTooltip}
          stateOpen={stateOpen}
          tooltip={`Your borrow limit is at ${formatUsd(
            usedObligation.borrowLimit.toString(),
          )} and is ${formatPercent(
            borrowLimitOverSupply.toString(),
          )} of your supplied balance.`}
        />
      )}
      <Section
        width={unliquidatedWidth}
        tooltip='Once you hit your borrow limit, you could be dangerously close to liquidation.'
      />
      {!passedThreshold && (
        <Section
          extraClassName={styles.liquidationBar}
          open={showLiquidationThresholdTooltip}
          stateOpen={stateOpen}
          tooltip={`Your liquidation threshold is at ${formatUsd(
            usedObligation.liquidationThreshold.toString(),
          )} and is ${formatPercent(
            liquidationThresholdFactor.toString(),
          )} of your supplied balance.`}
        />
      )}
      <Section
        width={unusedSupply}
        tooltip='Supply more assets to increase your borrow limit and your liquidation threshold.'
      />
    </div>
  );
}

export default UtilizationBar;
