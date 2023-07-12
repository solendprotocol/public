import React, { ReactElement } from 'react';
import { Flex, Text, Tooltip } from '@chakra-ui/react';
import { InfoIcon, WarningTwoIcon } from '@chakra-ui/icons';
import classNames from 'classnames';

import styles from './Metric.module.scss';

type MetricPropType = {
  label?: React.ReactNode;
  value: React.ReactNode;
  secondary?: React.ReactNode;
  tooltip?: React.ReactNode;
  dangerTooltip?: React.ReactNode;
  alignCenter?: boolean;
  row?: boolean;
  flex?: number;
  style?: any;
};

function Metric({
  label,
  value,
  secondary,
  tooltip,
  dangerTooltip,
  row,
  alignCenter,
  flex,
  style,
}: MetricPropType): ReactElement {
  return (
    <Flex
      flex={flex}
      direction={row ? 'row' : 'column'}
      align={row ? 'center' : undefined}
      justify='space-between'
      style={style}
      className={classNames(styles.alignCenter, !alignCenter && styles.metric)}
    >
      {label && (
        <Flex className={styles.label} justify='space-between'>
          <Text variant='caption' color='secondary'>
            {label}
          </Text>
          {tooltip && (
            <Tooltip label={dangerTooltip ?? tooltip}>
              <Text variant='caption' color='secondary'>
                {dangerTooltip ? (
                  <WarningTwoIcon mb={0.5} />
                ) : (
                  <InfoIcon mb={0.5} />
                )}
              </Text>
            </Tooltip>
          )}
        </Flex>
      )}
      <Text>{value}</Text>
      {secondary && (
        <>
          <Text color='secondary' variant='caption'>
            {secondary}
          </Text>
        </>
      )}
    </Flex>
  );
}

export default Metric;
