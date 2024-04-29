import { AccountInfo, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import BN from "bn.js";
import { Buffer } from "buffer";
import * as fzstd from "fzstd";
import { RateLimiterLayout, RateLimiter } from "./rateLimiter";
import * as Layout from "../layout";
import { LastUpdate, LastUpdateLayout } from "./lastUpdate";
import { U64_MAX } from "../core/constants";

const BufferLayout = require("buffer-layout");

export interface Reserve {
  version: number;
  lastUpdate: LastUpdate;
  lendingMarket: PublicKey;
  liquidity: ReserveLiquidity;
  collateral: ReserveCollateral;
  config: ReserveConfig;
  rateLimiter: RateLimiter;
}

export interface ReserveLiquidity {
  mintPubkey: PublicKey;
  mintDecimals: number;
  supplyPubkey: PublicKey;
  // @FIXME: oracle option
  oracleOption: number;
  pythOracle: PublicKey;
  switchboardOracle: PublicKey;
  availableAmount: BN;
  borrowedAmountWads: BN;
  cumulativeBorrowRateWads: BN;
  accumulatedProtocolFeesWads: BN;
  marketPrice: BN;
  smoothedMarketPrice: BN;
}

export interface ReserveCollateral {
  mintPubkey: PublicKey;
  mintTotalSupply: BN;
  supplyPubkey: PublicKey;
}

export interface ReserveConfig {
  optimalUtilizationRate: number;
  maxUtilizationRate: number;
  loanToValueRatio: number;
  liquidationBonus: number;
  maxLiquidationBonus: number;
  liquidationThreshold: number;
  maxLiquidationThreshold: number;
  minBorrowRate: number;
  optimalBorrowRate: number;
  maxBorrowRate: number;
  superMaxBorrowRate: BN;
  fees: {
    borrowFeeWad: BN;
    flashLoanFeeWad: BN;
    hostFeePercentage: number;
  };
  depositLimit: BN;
  borrowLimit: BN;
  feeReceiver: PublicKey;
  protocolLiquidationFee: number;
  protocolTakeRate: number;
  addedBorrowWeightBPS: BN;
  borrowWeight: number;
  reserveType: AssetType;
}

export enum AssetType {
  Regular = 0,
  Isolated = 1,
}

export const ReserveConfigLayout = BufferLayout.struct(
  [
    BufferLayout.u8("optimalUtilizationRate"),
    BufferLayout.u8("maxUtilizationRate"),
    BufferLayout.u8("loanToValueRatio"),
    BufferLayout.u8("liquidationBonus"),
    BufferLayout.u8("maxLiquidationBonus"),
    BufferLayout.u8("liquidationThreshold"),
    BufferLayout.u8("maxLiquidationThreshold"),
    BufferLayout.u8("minBorrowRate"),
    BufferLayout.u8("optimalBorrowRate"),
    BufferLayout.u8("maxBorrowRate"),
    BufferLayout.u8("superMaxBorrowRate"),
    BufferLayout.struct(
      [
        Layout.uint64("borrowFeeWad"),
        Layout.uint64("flashLoanFeeWad"),
        BufferLayout.u8("hostFeePercentage"),
      ],
      "fees"
    ),
    Layout.uint64("depositLimit"),
    Layout.uint64("borrowLimit"),
    Layout.publicKey("feeReceiver"),
    BufferLayout.u8("protocolLiquidationFee"),
    BufferLayout.u8("protocolTakeRate"),
    Layout.uint64("addedBorrowWeightBPS"),
    BufferLayout.u8("reserveType"),
  ],
  "config"
);

export const ReserveLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8("version"),
    LastUpdateLayout,
    Layout.publicKey("lendingMarket"),
    Layout.publicKey("liquidityMintPubkey"),
    BufferLayout.u8("liquidityMintDecimals"),
    Layout.publicKey("liquiditySupplyPubkey"),
    // @FIXME: oracle option
    // TODO: replace u32 option with generic equivalent
    // BufferLayout.u32('oracleOption'),
    Layout.publicKey("liquidityPythOracle"),
    Layout.publicKey("liquiditySwitchboardOracle"),
    Layout.uint64("liquidityAvailableAmount"),
    Layout.uint128("liquidityBorrowedAmountWads"),
    Layout.uint128("liquidityCumulativeBorrowRateWads"),
    Layout.uint128("liquidityMarketPrice"),

    Layout.publicKey("collateralMintPubkey"),
    Layout.uint64("collateralMintTotalSupply"),
    Layout.publicKey("collateralSupplyPubkey"),

    BufferLayout.u8("optimalUtilizationRate"),
    BufferLayout.u8("loanToValueRatio"),
    BufferLayout.u8("liquidationBonus"),
    BufferLayout.u8("liquidationThreshold"),
    BufferLayout.u8("minBorrowRate"),
    BufferLayout.u8("optimalBorrowRate"),
    BufferLayout.u8("maxBorrowRate"),
    Layout.uint64("borrowFeeWad"),
    Layout.uint64("flashLoanFeeWad"),
    BufferLayout.u8("hostFeePercentage"),
    Layout.uint64("depositLimit"),
    Layout.uint64("borrowLimit"),
    Layout.publicKey("feeReceiver"),
    BufferLayout.u8("protocolLiquidationFee"),
    BufferLayout.u8("protocolTakeRate"),
    Layout.uint128("accumulatedProtocolFeesWads"),
    RateLimiterLayout,
    Layout.uint64("addedBorrowWeightBPS"),
    Layout.uint128("liquiditySmoothedMarketPrice"),
    BufferLayout.u8("reserveType"),
    BufferLayout.u8("maxUtilizationRate"),
    Layout.uint64("superMaxBorrowRate"),
    BufferLayout.u8("maxLiquidationBonus"),
    BufferLayout.u8("maxLiquidationThreshold"),
    BufferLayout.blob(138, "padding"),
  ]
);

function decodeReserve(buffer: Buffer): Reserve {
  const reserve = ReserveLayout.decode(buffer);
  return {
    version: reserve.version,
    lastUpdate: reserve.lastUpdate,
    lendingMarket: reserve.lendingMarket,
    liquidity: {
      mintPubkey: reserve.liquidityMintPubkey,
      mintDecimals: reserve.liquidityMintDecimals,
      supplyPubkey: reserve.liquiditySupplyPubkey,
      // @FIXME: oracle option
      oracleOption: reserve.liquidityOracleOption,
      pythOracle: reserve.liquidityPythOracle,
      switchboardOracle: reserve.liquiditySwitchboardOracle,
      availableAmount: reserve.liquidityAvailableAmount,
      borrowedAmountWads: reserve.liquidityBorrowedAmountWads,
      cumulativeBorrowRateWads: reserve.liquidityCumulativeBorrowRateWads,
      marketPrice: reserve.liquidityMarketPrice,
      accumulatedProtocolFeesWads: reserve.accumulatedProtocolFeesWads,
      smoothedMarketPrice: reserve.smoothedMarketPrice,
    },
    collateral: {
      mintPubkey: reserve.collateralMintPubkey,
      mintTotalSupply: reserve.collateralMintTotalSupply,
      supplyPubkey: reserve.collateralSupplyPubkey,
    },
    config: {
      optimalUtilizationRate: reserve.optimalUtilizationRate,
      maxUtilizationRate: Math.max(
        reserve.maxUtilizationRate,
        reserve.optimalUtilizationRate
      ),
      loanToValueRatio: reserve.loanToValueRatio,
      liquidationBonus: reserve.liquidationBonus,
      maxLiquidationBonus: Math.max(
        reserve.maxLiquidationBonus,
        reserve.liquidationBonus
      ),
      liquidationThreshold: reserve.liquidationThreshold,
      maxLiquidationThreshold: Math.max(
        reserve.maxLiquidationThreshold,
        reserve.liquidationThreshold
      ),
      minBorrowRate: reserve.minBorrowRate,
      optimalBorrowRate: reserve.optimalBorrowRate,
      maxBorrowRate: reserve.maxBorrowRate,
      superMaxBorrowRate:
        reserve.superMaxBorrowRate > reserve.maxBorrowRate
          ? reserve.superMaxBorrowRate
          : new BN(reserve.maxBorrowRate),
      fees: {
        borrowFeeWad: reserve.borrowFeeWad,
        flashLoanFeeWad: reserve.flashLoanFeeWad,
        hostFeePercentage: reserve.hostFeePercentage,
      },
      depositLimit: reserve.depositLimit,
      borrowLimit: reserve.borrowLimit,
      feeReceiver: reserve.feeReceiver,
      // value is stored on-chain as deca bps (10 deca bp = 1 bps)
      protocolLiquidationFee: reserve.protocolLiquidationFee,
      protocolTakeRate: reserve.protocolTakeRate,
      addedBorrowWeightBPS: reserve.addedBorrowWeightBPS,
      borrowWeight:
        reserve.addedBorrowWeightBPS.toString() === U64_MAX
          ? Number(U64_MAX)
          : new BigNumber(reserve.addedBorrowWeightBPS.toString())
              .dividedBy(new BigNumber(10000))
              .plus(new BigNumber(1))
              .toNumber(),
      reserveType:
        reserve.reserveType == 0 ? AssetType.Regular : AssetType.Isolated,
    },
    rateLimiter: reserve.rateLimiter,
  };
}

export const RESERVE_SIZE = ReserveLayout.span;

export const isReserve = (info: AccountInfo<Buffer>) =>
  info.data.length === RESERVE_SIZE;

export const parseReserve = (
  pubkey: PublicKey,
  info: AccountInfo<Buffer>,
  encoding?: string
) => {
  if (encoding === "base64+zstd") {
    info.data = Buffer.from(fzstd.decompress(info.data));
  }
  const { data } = info;
  const buffer = Buffer.from(data);
  const reserve = decodeReserve(buffer);

  if (reserve.lastUpdate.slot.isZero()) {
    return null;
  }

  const details = {
    pubkey,
    account: {
      ...info,
    },
    info: reserve,
  };

  return details;
};

export function reserveToString(reserve: Reserve) {
  return JSON.stringify(
    reserve,
    (key, value) => {
      // Skip padding
      if (key === "padding" || key === "oracleOption" || value === undefined) {
        return null;
      }
      switch (value.constructor.name) {
        case "PublicKey":
          return value.toBase58();
        case "BN":
          return value.toString();
        default:
          return value;
      }
    },
    2
  );
}
