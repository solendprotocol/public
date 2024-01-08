import { Connection, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import SwitchboardProgram from "@switchboard-xyz/sbv2-lite";
import { fetchPrices } from "./prices";
import { calculateBorrowInterest, calculateSupplyInterest } from "./rates";
import { PoolType, ReserveType } from "../types";
import { parseReserve, Reserve } from "../../state";
import { parseRateLimiter } from "./utils";

export async function fetchPools(
  oldPools: Array<PoolType>,
  connection: Connection,
  switchboardProgram: SwitchboardProgram,
  programId: string,
  currentSlot: number,
  debug?: boolean
) {
  const reserves = (
    await getReservesFromChain(
      connection,
      switchboardProgram,
      programId,
      currentSlot,
      debug
    )
  ).sort((a, b) => (a.totalSupply.isGreaterThan(b.totalSupply) ? -1 : 1));

  const pools = Object.fromEntries(
    oldPools.map((c) => [
      c.address,
      {
        name: c.name,
        address: c.address,
        authorityAddress: c.authorityAddress,
        reserves: [] as Array<ReserveType>,
        owner: c.owner,
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
  price:
    | {
        spotPrice: number;
        emaPrice: number;
      }
    | undefined,
  currentSlot: number
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
    ? BigNumber(price.spotPrice)
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
    maxUtilizationRate: reserve.info.config.maxUtilizationRate / 100,
    minBorrowApr: reserve.info.config.minBorrowRate / 100,
    maxBorrowApr: reserve.info.config.maxBorrowRate / 100,
    superMaxBorrowRate: reserve.info.config.superMaxBorrowRate.toNumber() / 100,
    supplyInterest: calculateSupplyInterest(reserve.info, false),
    borrowInterest: calculateBorrowInterest(reserve.info, false),
    totalSupply,
    totalBorrow,
    availableAmount,
    rateLimiter: parseRateLimiter(reserve.info.rateLimiter, currentSlot),
    totalSupplyUsd: totalSupply.times(priceResolved),
    totalBorrowUsd: totalBorrow.times(priceResolved),
    availableAmountUsd: availableAmount.times(priceResolved),
    loanToValueRatio: reserve.info.config.loanToValueRatio / 100,
    liquidationThreshold: reserve.info.config.liquidationThreshold / 100,
    maxLiquidationThreshold: reserve.info.config.maxLiquidationThreshold / 100,
    liquidationPenalty: reserve.info.config.liquidationBonus / 100,
    maxLiquidationPenalty: reserve.info.config.maxLiquidationBonus / 100,
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
    addedBorrowWeightBPS: reserve.info.config.addedBorrowWeightBPS,
    borrowWeight: reserve.info.config.borrowWeight,
    emaPrice: price?.emaPrice,
    minPrice:
      price?.emaPrice && price?.spotPrice
        ? BigNumber.min(price.emaPrice, price.spotPrice)
        : new BigNumber(price?.spotPrice ?? priceResolved),
    maxPrice:
      price?.emaPrice && price?.spotPrice
        ? BigNumber.max(price.emaPrice, price.spotPrice)
        : new BigNumber(price?.spotPrice ?? priceResolved),
  };
}

export const getReservesOfPool = async (
  lendingMarketPubkey: PublicKey,
  connection: Connection,
  programId: string,
  currentSlot: number,
  switchboardProgram?: SwitchboardProgram,
  debug?: boolean
) => {
  if (debug) console.log("getReservesOfPool");

  let sb =
    switchboardProgram ?? (await SwitchboardProgram.loadMainnet(connection));

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

  const prices = await fetchPrices(parsedReserves, connection, sb, debug);

  return parsedReserves.map((r) =>
    formatReserve(r, prices[r.pubkey.toBase58()], currentSlot)
  );
};

export const getReservesFromChain = async (
  connection: Connection,
  switchboardProgram: SwitchboardProgram,
  programId: string,
  currentSlot: number,
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
    formatReserve(r, prices[r.pubkey.toBase58()], currentSlot)
  );
};

export async function fetchPoolByAddress(
  poolAddress: string,
  connection: Connection,
  debug?: boolean
) {
  if (debug) console.log("fetchPoolByAddress");

  const accountInfo = await connection.getAccountInfo(
    new PublicKey(poolAddress)
  );

  if (!accountInfo) {
    return null;
  }

  return parseReserve(new PublicKey(poolAddress), accountInfo);
}
