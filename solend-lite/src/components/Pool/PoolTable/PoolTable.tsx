import { Text, Flex, Box, Tooltip } from '@chakra-ui/react';
import { ReserveWithMetadataType } from 'stores/pools';
import { createColumnHelper } from '@tanstack/react-table';
import { formatPercent, formatToken, formatUsd } from 'utils/numberFormatter';
import Token from 'components/Token/Token';
import {
  ASSET_BORROW_LIMIT_TOOLTIP,
  ASSET_SUPPLY_LIMIT_TOOLTIP,
} from '../Pool';
import { DataTable } from 'components/DataTable/DataTable';

export default function PoolTable({
  reserves,
  selectReserveWithModal,
}: {
  reserves: Array<ReserveWithMetadataType>;
  selectReserveWithModal: (reserve: string) => void;
}) {
  const columnHelper = createColumnHelper<ReserveWithMetadataType>();

  const columns = [
    columnHelper.accessor('symbol', {
      header: 'Asset name',
      cell: ({ row: { original: reserve } }) => (
        <Flex align='center'>
          <Token size={32} reserve={reserve} />
          <Box ml={4}>
            <Text>
              {reserve.symbol ??
                `${reserve.mintAddress.slice(
                  0,
                  4,
                )}...${reserve.mintAddress.slice(
                  -4,
                  reserve.mintAddress.length - 1,
                )}`}
            </Text>
            <Text color='secondary' variant='label'>
              {formatUsd(reserve.price)}
            </Text>
          </Box>
        </Flex>
      ),
    }),
    columnHelper.accessor('loanToValueRatio', {
      header: 'LTV',
      meta: { isNumeric: true },
      cell: ({ row: { original: reserve } }) => (
        <Text>{formatPercent(reserve.loanToValueRatio, false, 0)}</Text>
      ),
    }),
    columnHelper.accessor('totalSupplyUsd', {
      header: 'Total supply',
      sortingFn: 'bigNumberSort' as any,
      meta: { isNumeric: true },
      cell: ({ row: { original: reserve } }) => {
        const atSupplyLimit =
          reserve.reserveSupplyCap.eq(0) ||
          reserve.totalSupply.isGreaterThanOrEqualTo(
            reserve.reserveSupplyCap.times(
              Math.min(0.9999, 1 - 1 / Number(reserve.reserveSupplyCap)),
            ),
          );

        return (
          <>
            <Tooltip
              label={atSupplyLimit ? ASSET_SUPPLY_LIMIT_TOOLTIP : undefined}
            >
              <Text color={atSupplyLimit ? 'secondary' : undefined}>
                {formatToken(reserve.totalSupply)} {reserve.symbol}
              </Text>
            </Tooltip>
            <Text color='secondary' variant='label'>
              {formatUsd(reserve.totalSupplyUsd)}
            </Text>
          </>
        );
      },
    }),
    columnHelper.accessor('supplyInterest', {
      header: 'Supply APR',
      meta: { isNumeric: true },
      cell: ({ row: { original: reserve } }) => (
        <>
          <Text>{formatPercent(reserve.supplyInterest)}</Text>
          <br/>
        </>
      ),
    }),
    columnHelper.accessor('totalBorrowUsd', {
      header: 'Total borrow',
      sortingFn: 'bigNumberSort' as any,
      meta: { isNumeric: true },
      cell: ({ row: { original: reserve } }) => {
        const atBorrowLimit =
          reserve.reserveBorrowCap.eq(0) ||
          reserve.totalBorrow.isGreaterThanOrEqualTo(
            reserve.reserveBorrowCap.times(
              Math.min(0.9999, 1 - 1 / Number(reserve.reserveBorrowCap)),
            ),
          );

        return (
          <>
            <Tooltip
              label={atBorrowLimit ? ASSET_BORROW_LIMIT_TOOLTIP : undefined}
            >
              <Text color={atBorrowLimit ? 'secondary' : undefined}>
                {formatToken(reserve.totalBorrow)} {reserve.symbol}
              </Text>
            </Tooltip>
            <Text color='secondary' variant='label'>
              {formatUsd(reserve.totalBorrowUsd)}
            </Text>
          </>
        );
      },
    }),
    columnHelper.accessor('borrowInterest', {
      header: 'Borrow APR',
      meta: { isNumeric: true },
      cell: ({ row: { original: reserve } }) => (
        <>
          <Text>{formatPercent(reserve.borrowInterest)}</Text>
          <br/>
        </>
      ),
    }),
  ];

  return (
    <DataTable
      columns={columns}
      data={reserves}
      onRowClick={selectReserveWithModal}
    />
  );
}
