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
        <Text>{formatPercent(reserve.supplyInterest)}</Text>
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
        <Text>{formatPercent(reserve.borrowInterest)}</Text>
      ),
    }),
  ];

  return (
    <DataTable
      columns={columns}
      data={reserves}
      onRowClick={selectReserveWithModal}
    />
    // <TableContainer>
    //   <Table size='sm'>
    //     <Thead>
    //       <Tr>
    //         <Th>
    //           <Text color='secondary' variant='caption'>
    //             Asset name
    //           </Text>
    //         </Th>
    //         <Th isNumeric>
    //           <Text color='secondary' variant='caption'>
    //             LTV
    //           </Text>
    //         </Th>
    //         <Th isNumeric>
    //           <Text color='secondary' variant='caption'>
    //             Total supply
    //           </Text>
    //         </Th>
    //         <Th isNumeric>
    //           <Text color='secondary' variant='caption'>
    //             Supply APR
    //           </Text>
    //         </Th>
    //         <Th isNumeric>
    //           <Text color='secondary' variant='caption'>
    //             Total borrow
    //           </Text>
    //         </Th>
    //         <Th isNumeric>
    //           <Text color='secondary' variant='caption'>
    //             Borrow APR
    //           </Text>
    //         </Th>
    //       </Tr>
    //     </Thead>
    //     <Tbody>
    //       {reserves.map((reserve) => {
    //         const atSupplyLimit = reserve.reserveSupplyCap.eq(0) ||
    //         reserve.totalSupply.isGreaterThanOrEqualTo(
    //         reserve.reserveSupplyCap.times(
    //             Math.min(0.9999, 1 - 1 / Number(reserve.reserveSupplyCap)),
    //         )
    //         );

    //         const atBorrowLimit = reserve.reserveBorrowCap.eq(0) ||
    //         reserve.totalBorrow.isGreaterThanOrEqualTo(
    //         reserve.reserveBorrowCap.times(
    //             Math.min(0.9999, 1 - 1 / Number(reserve.reserveBorrowCap)),
    //         )
    //         );

    //         return (
    //         <Tr
    //           key={reserve.address}
    //           onClick={() => selectReserveWithModal(reserve.address)}
    //           cursor='pointer'
    //         >
    //           <Td>
    //             <Flex align='center'>
    //               <Token size={32} reserve={reserve} />
    //               <Box ml={4}>
    //                 <Text>
    //                   {reserve.symbol ??
    //                     `${reserve.mintAddress.slice(
    //                       0,
    //                       4,
    //                     )}...${reserve.mintAddress.slice(
    //                       -4,
    //                       reserve.mintAddress.length - 1,
    //                     )}`}
    //                 </Text>
    //                 <Text color='secondary' variant='label'>
    //                   {formatUsd(reserve.price)}
    //                 </Text>
    //               </Box>
    //             </Flex>
    //           </Td>
    //           <Td isNumeric>
    // <Text>{formatPercent(reserve.loanToValueRatio, false, 0)}</Text>
    //           </Td>
    //   <Td isNumeric>
    // <Tooltip label={atSupplyLimit ? ASSET_SUPPLY_LIMIT_TOOLTIP : undefined}><Text color={atSupplyLimit ? 'secondary' : undefined}>
    //   {formatToken(reserve.totalSupply)} {reserve.symbol}
    // </Text></Tooltip>
    // <Text color='secondary' variant='label'>
    //   {formatUsd(reserve.totalSupplyUsd)}
    // </Text>
    //   </Td>
    //           <Td isNumeric>
    //             <Text>{formatPercent(reserve.supplyInterest)}</Text>
    //           </Td>
    //           <Td isNumeric>
    //           <Tooltip  label={atBorrowLimit ? ASSET_BORROW_LIMIT_TOOLTIP : undefined}>
    //             <Text color={atBorrowLimit ? 'secondary' : undefined}>
    //               {formatToken(reserve.totalBorrow)} {reserve.symbol}
    //             </Text>
    //             </Tooltip>
    //             <Text color='secondary' variant='label'>
    //               {formatUsd(reserve.totalBorrowUsd)}
    //             </Text>
    //           </Td>
    //   <Td isNumeric>
    //     <Text>{formatPercent(reserve.borrowInterest)}</Text>
    //   </Td>
    //         </Tr>
    //       )})}
    //     </Tbody>
    //   </Table>
    // </TableContainer>
  );
}
