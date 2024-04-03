import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import * as Layout from "../layout";
import { ReserveConfig } from "../state";
import { LendingInstruction } from "./instruction";

const BufferLayout = require("buffer-layout");

export const initReserveInstruction = (
  liquidityAmount: number | BN,
  config: ReserveConfig,
  sourceLiquidity: PublicKey,
  destinationCollateral: PublicKey,
  reserve: PublicKey,
  liquidityMint: PublicKey,
  liquiditySupply: PublicKey,
  liquidityFeeReceiver: PublicKey,
  collateralMint: PublicKey,
  collateralSupply: PublicKey,
  pythProduct: PublicKey,
  pythPrice: PublicKey,
  switchboardFeed: PublicKey,
  lendingMarket: PublicKey,
  lendingMarketAuthority: PublicKey,
  lendingMarketOwner: PublicKey,
  transferAuthority: PublicKey,
  lendingProgramId: PublicKey
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    Layout.uint64("liquidityAmount"),
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
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.InitReserve,
      liquidityAmount: new BN(liquidityAmount),
      optimalUtilizationRate: config.optimalUtilizationRate,
      maxUtilizationRate: config.maxUtilizationRate,
      loanToValueRatio: config.loanToValueRatio,
      liquidationBonus: config.liquidationBonus,
      liquidationThreshold: config.liquidationThreshold,
      minBorrowRate: config.minBorrowRate,
      optimalBorrowRate: config.optimalBorrowRate,
      maxBorrowRate: config.maxBorrowRate,
      superMaxBorrowRate: config.superMaxBorrowRate,
      borrowFeeWad: config.fees.borrowFeeWad,
      flashLoanFeeWad: config.fees.flashLoanFeeWad,
      hostFeePercentage: config.fees.hostFeePercentage,
      depositLimit: config.depositLimit,
      borrowLimit: config.borrowLimit,
      feeReceiver: config.feeReceiver,
      protocolLiquidationFee: config.protocolLiquidationFee,
      protocolTakeRate: config.protocolTakeRate,
      addedBorrowWeightBPS: config.addedBorrowWeightBPS,
      reserveType: config.reserveType,
      maxLiquidationBonus: config.maxLiquidationBonus,
      maxLiquidationThreshold: config.maxLiquidationThreshold,
    },
    data
  );

  const keys = [
    { pubkey: sourceLiquidity, isSigner: false, isWritable: true },
    { pubkey: destinationCollateral, isSigner: false, isWritable: true },
    { pubkey: reserve, isSigner: false, isWritable: true },
    { pubkey: liquidityMint, isSigner: false, isWritable: false },
    { pubkey: liquiditySupply, isSigner: false, isWritable: true },
    { pubkey: liquidityFeeReceiver, isSigner: false, isWritable: true },
    { pubkey: collateralMint, isSigner: false, isWritable: true },
    { pubkey: collateralSupply, isSigner: false, isWritable: true },
    { pubkey: pythProduct, isSigner: false, isWritable: false },
    { pubkey: pythPrice, isSigner: false, isWritable: false },
    { pubkey: switchboardFeed, isSigner: false, isWritable: false },
    { pubkey: lendingMarket, isSigner: false, isWritable: true },
    { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
    { pubkey: lendingMarketOwner, isSigner: true, isWritable: false },
    { pubkey: transferAuthority, isSigner: true, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: lendingProgramId,
    data,
  });
};
