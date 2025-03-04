import { Connection, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import SwitchboardProgram from "@switchboard-xyz/sbv2-lite";
import { fetchPrices } from "./prices";
import { calculateBorrowInterest, calculateSupplyInterest } from "./rates";
import { PoolType } from "../types";
import { parseReserve, RawReserveType } from "../../state";
import { parseRateLimiter } from "./utils";

export async function fetchPools(
  oldPools: Array<PoolType>,
  connection: Connection,
  switchboardProgram: SwitchboardProgram,
  programId: string,
  currentSlot: number,
  skipPrices?: boolean,
  debug?: boolean
) {
  const reserves = (
    await getReservesFromChain(
      connection,
      switchboardProgram,
      programId,
      currentSlot,
      skipPrices,
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

export type ReserveType = ReturnType<typeof formatReserve>;

export function formatReserve(
  reserve: RawReserveType,
  priceData?: {
    spotPrice: number;
    emaPrice: number;
    lstAdjustmentRatio?: BigNumber;
    priceSource?: string;
  },
  currentSlot?: number,
  metadata?: {
    symbol: string;
    logo: string;
    name?: string;
  },
  config?: {
    showApy: boolean;
    avgSlotTime: number;
  }
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
  const priceResolved = priceData
    ? BigNumber(priceData.spotPrice)
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

  const lstPatch = priceData?.lstAdjustmentRatio
    ? {
        loanToValueRatio:
          Number(
            new BigNumber(reserve.info.config.loanToValueRatio)
              .div(priceData.lstAdjustmentRatio)
              .toString()
          ) / 100,
        liquidationThreshold:
          Number(
            new BigNumber(reserve.info.config.liquidationThreshold)
              .div(priceData.lstAdjustmentRatio)
              .toString()
          ) / 100,
        maxLiquidationThreshold:
          Number(
            new BigNumber(reserve.info.config.maxLiquidationThreshold)
              .div(priceData.lstAdjustmentRatio)
              .toString()
          ) / 100,
        liquidationBonus: Number(
          new BigNumber(reserve.info.config.liquidationBonus)
            .plus(new BigNumber(1))
            .times(priceData.lstAdjustmentRatio)
            .minus(new BigNumber(1))
            .toString()
        ),
        maxLiquidationBonus: Number(
          new BigNumber(reserve.info.config.maxLiquidationBonus)
            .plus(new BigNumber(1))
            .times(priceData.lstAdjustmentRatio)
            .minus(new BigNumber(1))
            .toString()
        ),
      }
    : {};

  return {
    disabled:
      reserve.info.config.depositLimit.toString() === "0" &&
      reserve.info.config.borrowLimit.toString() === "0",
    cumulativeBorrowRate,
    cTokenExchangeRate,
    name: metadata?.name,
    accumulatedProtocolFees,
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
    protocolLiquidationFee: reserve.info.config.protocolLiquidationFee / 1000,
    hostFee: reserve.info.config.fees.hostFeePercentage / 100,
    interestRateSpread: reserve.info.config.protocolTakeRate / 100,
    targetBorrowApr: reserve.info.config.optimalBorrowRate / 100,
    targetUtilization: reserve.info.config.optimalUtilizationRate / 100,
    maxUtilizationRate: reserve.info.config.maxUtilizationRate / 100,
    minBorrowApr: reserve.info.config.minBorrowRate / 100,
    maxBorrowApr: reserve.info.config.maxBorrowRate / 100,
    superMaxBorrowRate: reserve.info.config.superMaxBorrowRate.toNumber() / 100,
    supplyInterest: calculateSupplyInterest(
      reserve.info,
      Boolean(config?.showApy)
    ).times(0.5 / (config?.avgSlotTime ?? 0.5)),
    borrowInterest: calculateBorrowInterest(
      reserve.info,
      Boolean(config?.showApy)
    ).times(0.5 / (config?.avgSlotTime ?? 0.5)),
    totalSupply,
    totalBorrow,
    availableAmount,
    rateLimiter: parseRateLimiter(reserve.info.rateLimiter, currentSlot),
    totalSupplyUsd: totalSupply.times(priceResolved),
    totalBorrowUsd: totalBorrow.times(priceResolved),
    availableAmountUsd: availableAmount.times(priceResolved),
    loanToValueRatio:
      lstPatch.loanToValueRatio ?? reserve.info.config.loanToValueRatio / 100,
    liquidationThreshold:
      lstPatch.liquidationThreshold ??
      reserve.info.config.liquidationThreshold / 100,
    maxLiquidationThreshold:
      lstPatch.maxLiquidationThreshold ??
      reserve.info.config.maxLiquidationThreshold / 100,
    liquidationBonus:
      lstPatch.liquidationBonus ?? reserve.info.config.liquidationBonus / 100,
    maxLiquidationBonus:
      lstPatch.maxLiquidationBonus ??
      reserve.info.config.maxLiquidationBonus / 100,
    liquidityAddress: reserve.info.liquidity.supplyPubkey.toBase58(),
    cTokenLiquidityAddress: reserve.info.collateral.supplyPubkey.toBase58(),
    liquidityFeeReceiverAddress: reserve.info.config.feeReceiver.toBase58(),
    address,
    mintAddress: reserve.info.liquidity.mintPubkey.toBase58(),
    decimals,
    symbol: metadata?.symbol ?? reserve.info.liquidity.mintPubkey.toBase58(),
    logo: metadata?.logo,
    price: priceResolved,
    poolAddress: reserve.info.lendingMarket.toBase58(),
    pythOracle: reserve.info.liquidity.pythOracle.toBase58(),
    switchboardOracle: reserve.info.liquidity.switchboardOracle.toBase58(),
    addedBorrowWeightBPS: reserve.info.config.addedBorrowWeightBPS,
    borrowWeight: reserve.info.config.borrowWeight,
    priceData,
    emaPrice: priceData?.emaPrice,
    minPrice:
      priceData?.emaPrice && priceData?.spotPrice
        ? BigNumber.min(priceData.emaPrice, priceData.spotPrice)
        : new BigNumber(priceData?.spotPrice ?? priceResolved),
    maxPrice:
      priceData?.emaPrice && priceData?.spotPrice
        ? BigNumber.max(priceData.emaPrice, priceData.spotPrice)
        : new BigNumber(priceData?.spotPrice ?? priceResolved),
    reserveType: reserve.info.config.reserveType,
    scaledPriceOffsetBPS: reserve.info.config.scaledPriceOffsetBPS,
    extraOracle: reserve.info.config.extraOracle?.toBase58(),
    liquidityExtraMarketPriceFlag:
      reserve.info.config.liquidityExtraMarketPriceFlag,
    liquidityExtraMarketPrice: reserve.info.config.liquidityExtraMarketPrice,
    attributedBorrowValue: reserve.info.config.attributedBorrowValue,
    attributedBorrowLimitOpen: reserve.info.config.attributedBorrowLimitOpen,
    attributedBorrowLimitClose: reserve.info.config.attributedBorrowLimitClose,
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

  const sb =
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
    .filter(Boolean) as Array<RawReserveType>;

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
  skipPrices?: boolean,
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
    .filter(Boolean) as Array<RawReserveType>;

    let prices: { [key: string]: {
      spotPrice: number;
      emaPrice: number;
    } | undefined } = {};
    if (!skipPrices) {
      prices = await fetchPrices(
        parsedReserves,
        connection,
        switchboardProgram,
        debug
      );
    }

  return parsedReserves.map((r) =>
    formatReserve(r, prices?.[r.pubkey.toBase58()], currentSlot)
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
