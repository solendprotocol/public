import { AccountInfo, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { Buffer } from "buffer";
import * as Layout from "../utils/layout";
import { LastUpdate, LastUpdateLayout } from "./lastUpdate";

const BufferLayout = require("buffer-layout");

export interface Reserve {
  version: number;
  lastUpdate: LastUpdate;
  lendingMarket: PublicKey;
  liquidity: ReserveLiquidity;
  collateral: ReserveCollateral;
  config: ReserveConfig;
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
  marketPrice: BN;
  accumulatedProtocolFeesWads: BN;
}

export interface ReserveCollateral {
  mintPubkey: PublicKey;
  mintTotalSupply: BN;
  supplyPubkey: PublicKey;
}

export interface ReserveConfig {
  optimalUtilizationRate: number;
  loanToValueRatio: number;
  liquidationBonus: number;
  liquidationThreshold: number;
  minBorrowRate: number;
  optimalBorrowRate: number;
  maxBorrowRate: number;
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
}

export const ReserveConfigLayout = BufferLayout.struct(
  [
    BufferLayout.u8("optimalUtilizationRate"),
    BufferLayout.u8("loanToValueRatio"),
    BufferLayout.u8("liquidationBonus"),
    BufferLayout.u8("liquidationThreshold"),
    BufferLayout.u8("minBorrowRate"),
    BufferLayout.u8("optimalBorrowRate"),
    BufferLayout.u8("maxBorrowRate"),
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
    BufferLayout.blob(230, "padding"),
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
    },
    collateral: {
      mintPubkey: reserve.collateralMintPubkey,
      mintTotalSupply: reserve.collateralMintTotalSupply,
      supplyPubkey: reserve.collateralSupplyPubkey,
    },
    config: {
      optimalUtilizationRate: reserve.optimalUtilizationRate,
      loanToValueRatio: reserve.loanToValueRatio,
      liquidationBonus: reserve.liquidationBonus,
      liquidationThreshold: reserve.liquidationThreshold,
      minBorrowRate: reserve.minBorrowRate,
      optimalBorrowRate: reserve.optimalBorrowRate,
      maxBorrowRate: reserve.maxBorrowRate,
      fees: {
        borrowFeeWad: reserve.borrowFeeWad,
        flashLoanFeeWad: reserve.flashLoanFeeWad,
        hostFeePercentage: reserve.hostFeePercentage,
      },
      depositLimit: reserve.depositLimit,
      borrowLimit: reserve.borrowLimit,
      feeReceiver: reserve.feeReceiver,
      protocolLiquidationFee: reserve.protocolLiquidationFee,
      protocolTakeRate: reserve.protocolTakeRate,
    },
  };
}

export const RESERVE_SIZE = ReserveLayout.span;

export const isReserve = (info: AccountInfo<Buffer>) =>
  info.data.length === RESERVE_SIZE;

export const parseReserve = (pubkey: PublicKey, info: AccountInfo<Buffer>) => {
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
      if (key === "padding") {
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
