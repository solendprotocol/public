import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { RateLimiterConfig } from "../state/rateLimiter";
import * as Layout from "../layout";
import { LendingInstruction } from "./instruction";
import { NULL_ORACLE, InputReserveConfigParams } from "../core";

const BufferLayout = require("buffer-layout");

/// Updates a reserves config and a reserve price oracle pubkeys
///
/// Accounts expected by this instruction:
///
///   1. `[writable]` Reserve account - refreshed
///   2 `[]` Lending market account.
///   3 `[]` Derived lending market authority.
///   4 `[signer]` Lending market owner.
///   5 `[]` Pyth product key.
///   6 `[]` Pyth price key.
///   7 `[]` Switchboard key.
export const updateReserveConfig = (
  reserve: PublicKey,
  lendingMarket: PublicKey,
  lendingMarketAuthority: PublicKey,
  lendingMarketOwner: PublicKey,
  pythPrice: PublicKey,
  switchboardOracle: PublicKey,
  reserveConfig: InputReserveConfigParams,
  rateLimiterConfig: RateLimiterConfig,
  solendProgramAddress: PublicKey
): TransactionInstruction => {
  const dataAccounts = [
    BufferLayout.u8("instruction"),
    BufferLayout.u8("optimalUtilizationRate"),
    BufferLayout.u8("maxUtilizationRate"),
    BufferLayout.u8("loanToValueRatio"),
    BufferLayout.u8("liquidationBonus"),
    BufferLayout.u8("liquidationThreshold"),
    BufferLayout.u8("minBorrowRate"),
    BufferLayout.u8("optimalBorrowRate"),
    BufferLayout.u8("maxBorrowRate"),
    Layout.uint64("superMaxBorrowRate"),
    Layout.uint64("borrowFeeWad"),
    Layout.uint64("flashLoanFeeWad"),
    BufferLayout.u8("hostFeePercentage"),
    Layout.uint64("depositLimit"),
    Layout.uint64("borrowLimit"),
    Layout.publicKey("feeReceiver"),
    BufferLayout.u8("protocolLiquidationFee"),
    BufferLayout.u8("protocolTakeRate"),
    Layout.uint64("addedBorrowWeightBPS"),
    BufferLayout.u8("reserveType"),
    BufferLayout.u8("maxLiquidationBonus"),
    BufferLayout.u8("maxLiquidationThreshold"),
    Layout.int64("scaledPriceOffsetBPS"),
    BufferLayout.u8("extraOracle"),
    Layout.uint64("attributedBorrowLimitOpen"),
    Layout.uint64("attributedBorrowLimitClose"),
    Layout.uint64("windowDuration"),
    Layout.uint64("maxOutflow"),
  ];

  if (reserveConfig.extraOracle) {
    dataAccounts.splice(24, 0, Layout.publicKey("extraOraclePubkey"));
  }

  const dataLayout = BufferLayout.struct(dataAccounts);
  const data = Buffer.alloc(dataLayout.span);

  dataLayout.encode(
    {
      instruction: LendingInstruction.UpdateReserveConfig,
      optimalUtilizationRate: reserveConfig.optimalUtilizationRate,
      maxUtilizationRate: reserveConfig.maxUtilizationRate,
      loanToValueRatio: reserveConfig.loanToValueRatio,
      liquidationBonus: reserveConfig.liquidationBonus,
      liquidationThreshold: reserveConfig.liquidationThreshold,
      minBorrowRate: reserveConfig.minBorrowRate,
      optimalBorrowRate: reserveConfig.optimalBorrowRate,
      maxBorrowRate: reserveConfig.maxBorrowRate,
      superMaxBorrowRate: reserveConfig.superMaxBorrowRate,
      borrowFeeWad: reserveConfig.fees.borrowFeeWad,
      flashLoanFeeWad: reserveConfig.fees.flashLoanFeeWad,
      hostFeePercentage: reserveConfig.fees.hostFeePercentage,
      depositLimit: reserveConfig.depositLimit,
      borrowLimit: reserveConfig.borrowLimit,
      feeReceiver: reserveConfig.feeReceiver,
      protocolLiquidationFee: reserveConfig.protocolLiquidationFee,
      protocolTakeRate: reserveConfig.protocolTakeRate,
      addedBorrowWeightBPS: reserveConfig.addedBorrowWeightBPS,
      reserveType: reserveConfig.reserveType,
      maxLiquidationBonus: reserveConfig.maxLiquidationBonus,
      scaledPriceOffsetBPS: reserveConfig.scaledPriceOffsetBPS,
      extraOracle: Number(Boolean(reserveConfig.extraOracle)),
      extraOraclePubkey: reserveConfig.extraOracle,
      attributedBorrowLimitOpen: reserveConfig.attributedBorrowLimitOpen,
      attributedBorrowLimitClose: reserveConfig.attributedBorrowLimitClose,
      maxLiquidationThreshold: reserveConfig.maxLiquidationThreshold,
      windowDuration: rateLimiterConfig.windowDuration,
      maxOutflow: rateLimiterConfig.maxOutflow,
    },
    data
  );

  const keys = [
    { pubkey: reserve, isSigner: false, isWritable: true },
    { pubkey: lendingMarket, isSigner: false, isWritable: false },
    { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
    { pubkey: lendingMarketOwner, isSigner: true, isWritable: false },
    { pubkey: NULL_ORACLE, isSigner: false, isWritable: false },
    { pubkey: pythPrice, isSigner: false, isWritable: false },
    { pubkey: switchboardOracle, isSigner: false, isWritable: false },
  ];

  if (reserveConfig.extraOracle) {
    keys.push({
      pubkey: reserveConfig.extraOracle,
      isSigner: false,
      isWritable: false,
    });
  }

  return new TransactionInstruction({
    keys,
    programId: solendProgramAddress,
    data,
  });
};
