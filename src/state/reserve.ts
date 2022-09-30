import { AccountInfo, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import * as BufferLayout from "buffer-layout";
import { Buffer } from "buffer";
import * as Layout from "../utils/layout";
import { LastUpdate, LastUpdateLayout } from "./lastUpdate";

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
  pythOraclePubkey: PublicKey;
  switchboardOraclePubkey: PublicKey;
  availableAmount: BN;
  borrowedAmountWads: BN;
  cumulativeBorrowRateWads: BN;
  marketPrice: BN;
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
  feeReceiver?: PublicKey;
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

    BufferLayout.struct(
      [
        Layout.publicKey("mintPubkey"),
        BufferLayout.u8("mintDecimals"),
        Layout.publicKey("supplyPubkey"),
        // @FIXME: oracle option
        // TODO: replace u32 option with generic equivalent
        // BufferLayout.u32('oracleOption'),
        Layout.publicKey("pythOracle"),
        Layout.publicKey("switchboardOracle"),
        Layout.uint64("availableAmount"),
        Layout.uint128("borrowedAmountWads"),
        Layout.uint128("cumulativeBorrowRateWads"),
        Layout.uint128("marketPrice"),
      ],
      "liquidity"
    ),

    BufferLayout.struct(
      [
        Layout.publicKey("mintPubkey"),
        Layout.uint64("mintTotalSupply"),
        Layout.publicKey("supplyPubkey"),
      ],
      "collateral"
    ),
    ReserveConfigLayout,
    BufferLayout.blob(247, "padding"),
  ]
);

export const RESERVE_SIZE = ReserveLayout.span;

export const isReserve = (info: AccountInfo<Buffer>) =>
  info.data.length === ReserveLayout.span;

export const parseReserve = (pubkey: PublicKey, info: AccountInfo<Buffer>) => {
  const { data } = info;
  const buffer = Buffer.from(data);
  const reserve = ReserveLayout.decode(buffer) as Reserve;

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
