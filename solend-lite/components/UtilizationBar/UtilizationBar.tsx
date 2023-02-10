import React, { ReactElement } from 'react';
import classNames from 'classnames';
import { Tooltip } from '@chakra-ui/react';
import { formatPercent, formatUsd } from 'utils/numberFormatter';

import styles from './UtilizationBar.module.scss';
import { useAtom } from 'jotai';
import { selectedObligationAtom } from 'stores/obligations';
import BigNumber from 'bignumber.js';

Section.defaultProps = {
  width: 1.5,
  extraClassName: null,
  tooltip: null,
};

function Section({
  width = 1.5,
  extraClassName,
  tooltip,
}: {
  width?: number;
  extraClassName?: string;
  tooltip?: string;
}) {
  return (
    <Tooltip title={tooltip}>
      <div
        style={{
          width: `${width}%`,
        }}
        className={classNames(styles.section, extraClassName)}
      />
    </Tooltip>
  );
}

function UtilizationBar(): ReactElement {
  const [obligation] = useAtom(selectedObligationAtom);

  if (!obligation) return <div />;

  const passedLimit =
    obligation.totalSupplyValue.isZero() ||
    (!obligation.totalBorrowValue.isZero() &&
      obligation.totalBorrowValue.isGreaterThanOrEqualTo(
        obligation.borrowLimit,
      ));
  const passedThreshold =
    obligation.totalSupplyValue.isZero() ||
    (!obligation.totalBorrowValue.isZero() &&
      obligation.totalBorrowValue.isGreaterThanOrEqualTo(
        obligation.liquidationThreshold,
      ));
  // 2% reserved for the bars
  const denominator = 97 + (passedLimit ? 1 : 0) + (passedThreshold ? 1 : 0);

  const borrowWidth = Math.min(
    100,
    Number(Number(obligation.borrowOverSupply.toString()).toFixed(4)) *
      denominator,
  );
  const unborrowedWidth =
    Number(
      Number(
        obligation.totalSupplyValue.isZero()
          ? BigNumber(0)
          : BigNumber.max(
              obligation.borrowLimit.minus(obligation.totalBorrowValue),
              BigNumber(0),
            )
              .dividedBy(obligation.totalSupplyValue)
              .toString(),
      ).toFixed(4),
    ) * denominator;
  const unliquidatedWidth =
    Number(
      Number(
        obligation.totalSupplyValue.isZero()
          ? BigNumber(0)
          : BigNumber.max(
              obligation.liquidationThreshold.minus(
                BigNumber.max(
                  obligation.borrowLimit,
                  obligation.totalBorrowValue,
                ),
              ),
              BigNumber(0),
            )
              .dividedBy(obligation.totalSupplyValue)
              .toString(),
      ).toFixed(4),
    ) * denominator;
  const unusedSupply =
    denominator - borrowWidth - unborrowedWidth - unliquidatedWidth;

  let borrowToolTip = `You are borrowing ${formatPercent(
    obligation.borrowOverSupply.toString(),
  )} of your total supply, or ${formatPercent(
    obligation.borrowUtilization.toString(),
  )} of your borrow limit.`;
  if (passedLimit) {
    borrowToolTip =
      'Your borrow balance is past the borrow limit and could be at risk of liquidation. Please repay your borrow balance or supply more assets.';
  }
  if (passedThreshold) {
    borrowToolTip =
      'Your borrow balance is past the liquidation threshold and could be liquidated.';
  }

  return (
    <div className={styles.container}>
      <Section
        width={borrowWidth}
        extraClassName={passedLimit ? styles.overBorrowed : styles.borrowed}
        tooltip={borrowToolTip}
      />
      {!passedLimit && (
        <Section
          width={unborrowedWidth}
          tooltip={`You can borrow ${formatUsd(
            obligation.borrowLimit
              .minus(obligation.totalBorrowValue)
              .toString(),
          )} more before you hit your borrow limit.`}
        />
      )}
      {!passedLimit && (
        <Section
          extraClassName={styles.limitBar}
          tooltip={`Your borrow limit is at ${formatUsd(
            obligation.borrowLimit.toString(),
          )} and is ${formatPercent(
            obligation.borrowLimitOverSupply.toString(),
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
          tooltip={`Your liquidation threshold is at ${formatUsd(
            obligation.liquidationThreshold.toString(),
          )} and is ${formatPercent(
            obligation.liquidationThresholdFactor.toString(),
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
