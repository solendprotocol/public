import { parsePriceData } from '@pythnetwork/client';
import { Connection, PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { parseReserve, Reserve } from '../../solend-sdk/src/state';
import { LENDING_MARKET_SIZE } from '../../solend-sdk/src/state/lendingMarket';
import { computeExtremeRates, getBatchMultipleAccountsInfo } from './common';
import SwitchboardProgram from '@switchboard-xyz/sbv2-lite';
import { PROGRAM_ID, SLOTS_PER_YEAR, SOLEND_ADDRESSES } from './config';
import { ReserveType } from 'stores/pools';

const SBV2_MAINNET = 'SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f';

export async function fetchPools(
  poolAddressAddresses: Array<string>,
  connection: Connection,
  switchboardProgram: SwitchboardProgram,
) {
  const reserves = await getReservesFromChain(connection, switchboardProgram);

  let pools = Object.fromEntries(
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

async function getPrices(
  parsedReserves: Array<{ info: Reserve; pubkey: PublicKey }>,
  connection: Connection,
  switchboardProgram: SwitchboardProgram,
) {
  const oracles = parsedReserves
    .map((reserve) => reserve.info.liquidity.pythOracle)
    .concat(
      parsedReserves.map((reserve) => reserve.info.liquidity.switchboardOracle),
    );

  const priceAccounts = await getBatchMultipleAccountsInfo(oracles, connection);

  return parsedReserves.reduce((acc, reserve, i) => {
    const pythOracleData = priceAccounts[i];
    const switchboardOracleData = priceAccounts[parsedReserves.length + i];

    let priceData: number | undefined;

    if (pythOracleData) {
      const { price, previousPrice } = parsePriceData(
        pythOracleData.data as Buffer,
      );

      if (price || previousPrice) {
        // use latest price if available otherwise fallback to previoius
        priceData = price || previousPrice;
      }
    }

    // Only attempt to fetch from switchboard if not already available from pyth
    if (!priceData) {
      const rawSb = switchboardOracleData;
      const switchboardData = (switchboardOracleData?.data as Buffer)?.slice(1);
      if (rawSb && switchboardData) {
        const owner = rawSb.owner.toString();
        if (owner === SBV2_MAINNET) {
          const result = switchboardProgram.decodeLatestAggregatorValue(rawSb!);

          priceData = result?.toNumber();
        }
      }
    }

    return {
      ...acc,
      [reserve.pubkey.toBase58()]: priceData,
    };
  }, {}) as { [address: string]: number };
}

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

const calculateSupplyAPR = (reserve: Reserve) => {
  const currentUtilization = calculateUtilizationRatio(reserve);

  const borrowAPR = calculateBorrowAPR(reserve);
  const protocolTakePercentage = BigNumber(1).minus(
    reserve.config.protocolTakeRate / 100,
  );

  return currentUtilization.times(borrowAPR).times(protocolTakePercentage);
};

const calculateUtilizationRatio = (reserve: Reserve) => {
  const borrowedAmount = new BigNumber(
    reserve.liquidity.borrowedAmountWads.toString(),
  ).shiftedBy(-18);
  const totalSupply = borrowedAmount.plus(
    reserve.liquidity.availableAmount.toString(),
  );
  const currentUtilization = borrowedAmount.dividedBy(totalSupply);

  return currentUtilization;
};

const calculateBorrowAPR = (reserve: Reserve) => {
  const currentUtilization = calculateUtilizationRatio(reserve);
  const optimalUtilization = new BigNumber(
    reserve.config.optimalUtilizationRate / 100,
  );

  let borrowAPR;
  if (
    optimalUtilization.isEqualTo(1) ||
    currentUtilization.isLessThan(optimalUtilization)
  ) {
    const normalizedFactor = currentUtilization.dividedBy(optimalUtilization);
    const optimalBorrowRate = new BigNumber(
      reserve.config.optimalBorrowRate / 100,
    );
    const minBorrowRate = new BigNumber(reserve.config.minBorrowRate / 100);
    borrowAPR = normalizedFactor
      .times(optimalBorrowRate.minus(minBorrowRate))
      .plus(minBorrowRate);
  } else {
    if (reserve.config.optimalBorrowRate === reserve.config.maxBorrowRate) {
      return new BigNumber(
        computeExtremeRates(reserve.config.maxBorrowRate / 100),
      );
    }
    const normalizedFactor = currentUtilization
      .minus(optimalUtilization)
      .dividedBy(new BigNumber(1).minus(optimalUtilization));
    const optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
    const maxBorrowRate = reserve.config.maxBorrowRate / 100;
    borrowAPR = normalizedFactor
      .times(maxBorrowRate - optimalBorrowRate)
      .plus(optimalBorrowRate);
  }

  return borrowAPR;
};

const calculateSupplyAPY = (reserve: Reserve) => {
  const apr = calculateSupplyAPR(reserve);
  const apy =
    new BigNumber(1)
      .plus(new BigNumber(apr).dividedBy(SLOTS_PER_YEAR))
      .toNumber() **
      SLOTS_PER_YEAR -
    1;
  return new BigNumber(apy);
};

const calculateBorrowAPY = (reserve: Reserve) => {
  const apr = calculateBorrowAPR(reserve);
  const apy =
    new BigNumber(1)
      .plus(new BigNumber(apr).dividedBy(SLOTS_PER_YEAR))
      .toNumber() **
      SLOTS_PER_YEAR -
    1;
  return new BigNumber(apy);
};

const calculateSupplyInterest = (reserve: Reserve, showApy: boolean) =>
  showApy ? calculateSupplyAPY(reserve) : calculateSupplyAPR(reserve);

const calculateBorrowInterest = (reserve: Reserve, showApy: boolean) =>
  showApy ? calculateBorrowAPY(reserve) : calculateBorrowAPR(reserve);
