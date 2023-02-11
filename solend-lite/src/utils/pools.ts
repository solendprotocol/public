import { AccountInfo, Connection, PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { parseReserve, Reserve } from '../../../solend-sdk/src/state';
import { LENDING_MARKET_SIZE } from '../../../solend-sdk/src/state/lendingMarket';
import SwitchboardProgram from '@switchboard-xyz/sbv2-lite';
import {
  MAIN_POOL_RESERVES_ADDRESSES,
  PROGRAM_ID,
  SOLEND_ADDRESSES,
} from 'common/config';
import { ReserveType } from 'stores/pools';
import { getPrices } from './assetPrices';
import { calculateBorrowInterest, calculateSupplyInterest } from './rates';

export async function fetchPools(
  poolAddressAddresses: Array<string>,
  connection: Connection,
  switchboardProgram: SwitchboardProgram,
) {
  const reserves = await getReservesFromChain(connection, switchboardProgram);

  const pools = Object.fromEntries(
    poolAddressAddresses.map((address) => [
      address,
      {
        address,
        reserves: [] as Array<ReserveType>,
      },
    ]),
  );

  reserves
    .filter((reserve) => poolAddressAddresses.includes(reserve.poolAddress))
    .forEach((reserve) => {
      pools[reserve.poolAddress].reserves.push(reserve);
    }, []);

  return pools;
}

export const getPoolsFromChain = async (connection: Connection) => {
  const filters = [
    { dataSize: LENDING_MARKET_SIZE },
    { memcmp: { offset: 2, bytes: SOLEND_ADDRESSES[0] } },
  ];

  const pools = await connection.getProgramAccounts(PROGRAM_ID, {
    commitment: connection.commitment,
    filters,
    encoding: 'base64',
  });

  const poolList = pools.map((pool) => {
    const Pool = {
      address: pool.pubkey.toBase58(),
    };
    return Pool;
  });

  return poolList
    .map((p) => p.address)
    .sort()
    .map((key) => ({
      name: null,
      address: key,
    }));
};

function formatReserve(
  reserve: {
    pubkey: PublicKey;
    info: Reserve;
  },
  price: number | null,
) {
  const decimals = reserve.info.liquidity.mintDecimals;
  const availableAmount = new BigNumber(
    reserve.info.liquidity.availableAmount.toString(),
  ).shiftedBy(-decimals);
  const totalBorrow = new BigNumber(
    reserve.info.liquidity.borrowedAmountWads.toString(),
  ).shiftedBy(-18 - decimals);
  const totalSupply = totalBorrow.plus(availableAmount);
  const address = reserve.pubkey.toBase58();
  const priceResolved = price
    ? BigNumber(price)
    : new BigNumber(reserve.info.liquidity.marketPrice.toString()).shiftedBy(
        -18,
      );
  return {
    reserveUtilization: totalBorrow.dividedBy(totalSupply),
    cTokenMint: reserve.info.collateral.mintPubkey.toBase58(),
    feeReceiverAddress: reserve.info.config.feeReceiver?.toBase58(),
    reserveSupplyLimit: new BigNumber(
      reserve.info.config.depositLimit.toString(),
    ).shiftedBy(-decimals),
    reserveBorrowLimit: new BigNumber(
      reserve.info.config.borrowLimit.toString(),
    ).shiftedBy(-decimals),
    borrowFee: new BigNumber(
      reserve.info.config.fees.borrowFeeWad.toString(),
    ).shiftedBy(-18),
    flashLoanFee: new BigNumber(
      reserve.info.config.fees.flashLoanFeeWad.toString(),
    ).shiftedBy(-18),
    protocolLiquidationFee: reserve.info.config.protocolLiquidationFee / 100,
    hostFee: reserve.info.config.fees.hostFeePercentage / 100,
    interestRateSpread: reserve.info.config.protocolTakeRate / 100,
    reserveSupplyCap: new BigNumber(
      reserve.info.config.depositLimit.toString(),
    ).shiftedBy(-decimals),
    reserveBorrowCap: new BigNumber(
      reserve.info.config.borrowLimit.toString(),
    ).shiftedBy(-decimals),
    targetBorrowApr: reserve.info.config.optimalBorrowRate / 100,
    targetUtilization: reserve.info.config.optimalUtilizationRate / 100,
    maxBorrowApr: reserve.info.config.maxBorrowRate / 100,
    supplyInterest: calculateSupplyInterest(reserve.info, false),
    borrowInterest: calculateBorrowInterest(reserve.info, false),
    totalSupply,
    totalBorrow,
    availableAmount,
    totalSupplyUsd: totalSupply.times(priceResolved),
    totalBorrowUsd: totalBorrow.times(priceResolved),
    availableAmountUsd: availableAmount.times(priceResolved),
    loanToValueRatio: reserve.info.config.loanToValueRatio / 100,
    liquidationThreshold: reserve.info.config.liquidationThreshold / 100,
    liquidationPenalty: reserve.info.config.liquidationBonus / 100,
    address,
    mintAddress: reserve.info.liquidity.mintPubkey.toBase58(),
    decimals,
    price: priceResolved,
    poolAddress: reserve.info.lendingMarket.toBase58(),
    pythOracle: reserve.info.liquidity.pythOracle.toBase58(),
    switchboardOracle: reserve.info.liquidity.switchboardOracle.toBase58(),
  };
}

export const getReservesOfPool = async (
  lendingMarketPubkey: PublicKey,
  connection: Connection,
  switchboardProgram: SwitchboardProgram,
) => {
  const filters = [
    { dataSize: 619 },
    { memcmp: { offset: 10, bytes: lendingMarketPubkey.toBase58() } },
  ];

  const rawReserves = await connection.getProgramAccounts(PROGRAM_ID, {
    commitment: connection.commitment,
    filters,
    encoding: 'base64',
  });

  const parsedReserves = rawReserves
    .map((reserve, index) =>
      reserve ? parseReserve(rawReserves[index].pubkey, reserve.account) : null,
    )
    .filter(Boolean) as Array<{ info: Reserve; pubkey: PublicKey }>;

  const prices = await getPrices(
    parsedReserves,
    connection,
    switchboardProgram,
  );
  return parsedReserves
    .map((r) => formatReserve(r, prices[r.pubkey.toBase58()]))
    .sort();
};

export const getReservesFromChain = async (
  connection: Connection,
  switchboardProgram: SwitchboardProgram,
) => {
  const filters = [{ dataSize: 619 }];

  const rawReserves = await connection.getProgramAccounts(PROGRAM_ID, {
    commitment: connection.commitment,
    filters,
    encoding: 'base64',
  });

  const parsedReserves = rawReserves
    .map((reserve, index) =>
      reserve ? parseReserve(rawReserves[index].pubkey, reserve.account) : null,
    )
    .filter(Boolean) as Array<{ info: Reserve; pubkey: PublicKey }>;

  const prices = await getPrices(
    parsedReserves,
    connection,
    switchboardProgram,
  );
  return parsedReserves
    .map((r) => formatReserve(r, prices[r.pubkey.toBase58()]))
    .sort();
};

export const reorderMainPoolReserves = (
  reserves: { pubkey: PublicKey; account: AccountInfo<Buffer> }[],
) => {
  const reservesMap = new Map<
    string,
    { pubkey: PublicKey; account: AccountInfo<Buffer> }
  >();
  reserves.forEach((reserve) => {
    reservesMap.set(reserve.pubkey.toBase58(), reserve);
  });

  let reorderedReserves: { pubkey: PublicKey; account: AccountInfo<Buffer> }[] =
    [];
  MAIN_POOL_RESERVES_ADDRESSES.forEach((reserveAddress) => {
    const reserve = reservesMap.get(reserveAddress);
    if (reserve) {
      reorderedReserves = [...reorderedReserves, reserve];
    }
  });
  return reorderedReserves;
};
