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
};

function Metric({
  label,
  value,
  secondary,
  tooltip,
  dangerTooltip,
  row,
  alignCenter,
}: MetricPropType): ReactElement {
  return (
    <Flex
      direction={row ? 'row' : 'column'}
      align={row ? 'center' : undefined}
      justify='space-between'
      className={classNames(styles.alignCenter, !alignCenter && styles.metric)}
    >
      {label && (
        <Flex align='center' justify={alignCenter ? 'center' : undefined}>
          <Text variant='caption' color='secondary'>
            {label}
          </Text>
          {tooltip && (
            <>
              <Tooltip label={dangerTooltip ?? tooltip}>
                <Text variant='caption' color='secondary'>
                  {dangerTooltip ? (
                    <WarningTwoIcon ml={1} />
                  ) : (
                    <InfoIcon ml={1} />
                  )}
                </Text>
              </Tooltip>
            </>
          )}
        </Flex>
      )}
      <Text display='flex'>{value}</Text>
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
