import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import * as BufferLayout from "buffer-layout";
import { ReserveConfig } from "../state/reserve";
import * as Layout from "../utils/layout";
import { LendingInstruction } from "./instruction";

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
  pythProduct: PublicKey,
  pythPrice: PublicKey,
  switchboardOracle: PublicKey,
  reserveConfig: ReserveConfig,
  solendProgramAddress: PublicKey
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
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
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.UpdateReserveConfig,
      optimalUtilizationRate: reserveConfig.optimalUtilizationRate,
      loanToValueRatio: reserveConfig.loanToValueRatio,
      liquidationBonus: reserveConfig.liquidationBonus,
      liquidationThreshold: reserveConfig.liquidationThreshold,
      minBorrowRate: reserveConfig.minBorrowRate,
      optimalBorrowRate: reserveConfig.optimalBorrowRate,
      maxBorrowRate: reserveConfig.maxBorrowRate,
      borrowFeeWad: reserveConfig.fees.borrowFeeWad,
      flashLoanFeeWad: reserveConfig.fees.flashLoanFeeWad,
      hostFeePercentage: reserveConfig.fees.hostFeePercentage,
      depositLimit: reserveConfig.depositLimit,
      borrowLimit: reserveConfig.borrowLimit,
      feeReceiver: reserveConfig.feeReceiver,
      protocolLiquidationFee: reserveConfig.protocolLiquidationFee,
      protocolTakeRate: reserveConfig.protocolTakeRate,
    },
    data
  );

  const keys = [
    { pubkey: reserve, isSigner: false, isWritable: true },
    { pubkey: lendingMarket, isSigner: false, isWritable: false },
    { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
    { pubkey: lendingMarketOwner, isSigner: true, isWritable: false },
    { pubkey: pythProduct, isSigner: false, isWritable: false },
    { pubkey: pythPrice, isSigner: false, isWritable: false },
    { pubkey: switchboardOracle, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: solendProgramAddress,
    data,
  });
};
