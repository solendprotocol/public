import React, { ReactElement } from 'react';
import { ReserveType } from '@solendprotocol/solend-sdk';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Label,
} from 'recharts';
import { themeConfig } from 'theme/theme';
import { Box, Text } from '@chakra-ui/react';
import { formatPercent } from 'utils/numberFormatter';

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    payload?: { name: string };
    value?: number;
  }>;
  label?: number;
}) => {
  if (active && payload && payload.length) {
    return (
      <Box bg='var(--chakra-colors-neutral)' p={2} opacity={0.9}>
        <Text>{payload[0]?.payload?.name}</Text>
        <Text
          variant='caption'
          color='secondary'
        >{`Utilization: ${formatPercent(
          (label ?? 0) / 100,
        )}`}</Text>
        <Text variant='caption' color='secondary'>{`Interest: ${formatPercent(
          (payload[0]?.value ?? 0) / 100,
        )}`}</Text>
        <br />
        <Text variant='caption' color='secondary'>
          Click to return to parameter view
        </Text>
      </Box>
    );
  }

  return null;
};

function InterestGraph({ reserve }: { reserve: ReserveType }): ReactElement {
  const data = [
    {
      name: 'Min borrow rate',
      utilization: 0,
      interest: reserve.minBorrowApr * 100,
      current: false,
    },
    {
      name: 'Target rate',
      utilization: reserve.targetUtilization * 100,
      interest: reserve.targetBorrowApr * 100,
      current: false,
    },
    {
      name: 'Max rate',
      utilization: reserve.maxUtilizationRate * 100,
      interest: reserve.maxBorrowApr * 100,
      current: false,
    },
    {
      name: 'Supermax rate',
      utilization: 100,
      interest: reserve.superMaxBorrowRate * 100,
      current: false,
    },
    {
      name: 'Current',
      utilization: reserve.reserveUtilization.toNumber() * 100,
      interest: reserve.borrowInterest.toNumber() * 100,
      current: true,
    },
  ].sort((a, b) => a.utilization - b.utilization);

  return (
    <ResponsiveContainer width='100%' height='100%'>
      <LineChart
        data={data}
        margin={{ top: 12, bottom: 24 }}
        style={{
          cursor: 'pointer',
        }}
      >
        <CartesianGrid strokeDasharray='1 1' />
        <XAxis
          offset={14}
          dataKey='utilization'
          domain={[0, 100]}
          type='number'
          style={{
            fontSize: 12,
          }}
          unit='%'
        >
          <Label
            value='Utilization'
            offset={-4}
            style={themeConfig.components.Text.variants.disclosure}
            color='var(--chakra-colors-secondary)'
            position='insideBottom'
          />
        </XAxis>
        <YAxis
          type='number'
          style={{
            fontSize: 12,
          }}
          unit='%'
        >
          <Label
            style={{
              ...themeConfig.components.Text.variants.disclosure,
              textAnchor: 'middle',
            }}
            color='var(--chakra-colors-secondary)'
            value='Borrow interest'
            position='insideLeft'
            angle={-90}
          />
        </YAxis>
        <Tooltip
          content={({
            active,
            payload,
            label,
          }: {
            active?: boolean;
            payload?: Array<{
              payload?: { name: string };
              value?: number;
            }>;
            label?: number;
          }) => (
            <CustomTooltip active={active} payload={payload} label={label} />
          )}
        />
        <Line dataKey='interest' stroke='#82ca9d' />
        <ReferenceDot
          x={reserve.reserveUtilization.toNumber() * 100}
          y={reserve.borrowInterest.toNumber() * 100}
          isFront
          fill='var(--chakra-colors-brand)'
          stroke='var(--chakra-colors-brand)'
          r={4}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default InterestGraph;
