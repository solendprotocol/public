import { Connection, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import SwitchboardProgram from "@switchboard-xyz/sbv2-lite";
import { fetchPrices } from "./prices";
import { calculateBorrowInterest, calculateSupplyInterest } from "./rates";
import { PoolType, ReserveType } from "../types";
import { parseReserve, Reserve } from "../../state";

export async function fetchPools(
  oldPools: Array<PoolType>,
  connection: Connection,
  switchboardProgram: SwitchboardProgram,
  programId: string,
  debug?: boolean
) {
  const reserves = (await getReservesFromChain(
    connection,
    switchboardProgram,
    programId,
    debug
  )).sort((a, b) => a.totalSupply.isGreaterThan(b.totalSupply) ? -1 : 1);

  const pools = Object.fromEntries(
    oldPools.map((c) => [
      c.address,
      {
        name: c.name,
        address: c.address,
        authorityAddress: c.authorityAddress,
        reserves: [] as Array<ReserveType>,
      },
    ])
  );

  reserves
    .filter((reserve) =>
      oldPools.map((c) => c.address).includes(reserve.poolAddress)
    )
    .forEach((reserve) => {
      pools[reserve.poolAddress].reserves.push(reserve);
    }, []);

  return pools;
}

export function formatReserve(
  reserve: {
    pubkey: PublicKey;
    info: Reserve;
  },
  price: number | null
) {
  const decimals = reserve.info.liquidity.mintDecimals;
  const availableAmount = new BigNumber(
    reserve.info.liquidity.availableAmount.toString()
  ).shiftedBy(-decimals);
  const totalBorrow = new BigNumber(
    reserve.info.liquidity.borrowedAmountWads.toString()
  ).shiftedBy(-18 - decimals);
  const accumulatedProtocolFees = new BigNumber(
    reserve.info.liquidity.accumulatedProtocolFeesWads.toString()
  ).shiftedBy(-18 - decimals);
  const totalSupply = totalBorrow
    .plus(availableAmount)
    .minus(accumulatedProtocolFees);
  const address = reserve.pubkey.toBase58();
  const priceResolved = price
    ? BigNumber(price)
    : new BigNumber(reserve.info.liquidity.marketPrice.toString()).shiftedBy(
        -18
      );

  const cTokenExchangeRate = new BigNumber(totalSupply).dividedBy(
    new BigNumber(reserve.info.collateral.mintTotalSupply.toString()).shiftedBy(
      -decimals
    )
  );
  const cumulativeBorrowRate = new BigNumber(
    reserve.info.liquidity.cumulativeBorrowRateWads.toString()
  ).shiftedBy(-18);

  return {
    disabled:
      reserve.info.config.depositLimit.toString() === "0" &&
      reserve.info.config.borrowLimit.toString() === "0",
    cumulativeBorrowRate,
    cTokenExchangeRate,
    reserveUtilization: totalBorrow.dividedBy(totalSupply),
    cTokenMint: reserve.info.collateral.mintPubkey.toBase58(),
    feeReceiverAddress: reserve.info.config.feeReceiver?.toBase58(),
    reserveSupplyLimit: new BigNumber(
      reserve.info.config.depositLimit.toString()
    ).shiftedBy(-decimals),
    reserveBorrowLimit: new BigNumber(
      reserve.info.config.borrowLimit.toString()
    ).shiftedBy(-decimals),
    borrowFee: new BigNumber(
      reserve.info.config.fees.borrowFeeWad.toString()
    ).shiftedBy(-18),
    flashLoanFee: new BigNumber(
      reserve.info.config.fees.flashLoanFeeWad.toString()
    ).shiftedBy(-18),
    protocolLiquidationFee: reserve.info.config.protocolLiquidationFee / 100,
    hostFee: reserve.info.config.fees.hostFeePercentage / 100,
    interestRateSpread: reserve.info.config.protocolTakeRate / 100,
    reserveSupplyCap: new BigNumber(
      reserve.info.config.depositLimit.toString()
    ).shiftedBy(-decimals),
    reserveBorrowCap: new BigNumber(
      reserve.info.config.borrowLimit.toString()
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
    liquidityAddress: reserve.info.liquidity.supplyPubkey.toBase58(),
    cTokenLiquidityAddress: reserve.info.collateral.supplyPubkey.toBase58(),
    liquidityFeeReceiverAddress: reserve.info.config.feeReceiver.toBase58(),
    address,
    mintAddress: reserve.info.liquidity.mintPubkey.toBase58(),
    decimals,
    symbol: undefined,
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
  programId: string,
  debug?: boolean
) => {
  if (debug) console.log("getReservesOfPool");

  const filters = [
    { dataSize: 619 },
    { memcmp: { offset: 10, bytes: lendingMarketPubkey.toBase58() } },
  ];

  const rawReserves = await connection.getProgramAccounts(
    new PublicKey(programId),
    {
      commitment: connection.commitment,
      filters,
      encoding: "base64",
    }
  );

  const parsedReserves = rawReserves
    .map((reserve, index) =>
      reserve ? parseReserve(rawReserves[index].pubkey, reserve.account) : null
    )
    .filter(Boolean) as Array<{ info: Reserve; pubkey: PublicKey }>;

  const prices = await fetchPrices(
    parsedReserves,
    connection,
    switchboardProgram,
    debug
  );

  return parsedReserves.map((r) =>
    formatReserve(r, prices[r.pubkey.toBase58()])
  );
};

export const getReservesFromChain = async (
  connection: Connection,
  switchboardProgram: SwitchboardProgram,
  programId: string,
  debug?: boolean
) => {
  if (debug) console.log("getReservesFromChain");

  const filters = [{ dataSize: 619 }];

  const rawReserves = await connection.getProgramAccounts(
    new PublicKey(programId),
    {
      commitment: connection.commitment,
      filters,
      encoding: "base64",
    }
  );

  const parsedReserves = rawReserves
    .map((reserve, index) =>
      reserve ? parseReserve(rawReserves[index].pubkey, reserve.account) : null
    )
    .filter(Boolean) as Array<{ info: Reserve; pubkey: PublicKey }>;

  const prices = await fetchPrices(
    parsedReserves,
    connection,
    switchboardProgram,
    debug
  );

  return parsedReserves.map((r) =>
    formatReserve(r, prices[r.pubkey.toBase58()])
  );
};
