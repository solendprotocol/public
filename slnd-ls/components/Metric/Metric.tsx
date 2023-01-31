import React, { ReactElement } from 'react';
import Image from 'next/image'
import { Flex, Spacer, Text, Tooltip  } from "@chakra-ui/react";
import { InfoIcon, WarningTwoIcon } from '@chakra-ui/icons';

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
}: MetricPropType): ReactElement {
  return (
    <Flex direction={row ? 'row' : 'column'}>
      {label && (
        <Text variant='caption' color='secondary'>
          {label}
          {tooltip && (
            <>
              <Tooltip label={dangerTooltip ?? tooltip}>
                {dangerTooltip ? (
                  <WarningTwoIcon />
                ) : (
                  <InfoIcon />
                )}
              </Tooltip>
            </>
          )}
        </Text>
      )}
      <Spacer/>
      <Text >{value}</Text>
      {secondary && (
        <>
          <Text
            color='secondary'
            variant='caption'
          >
            {secondary}
          </Text>
        </>
      )}
    </Flex>
  );
}

export default Metric;
