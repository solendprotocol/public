import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import * as BufferLayout from "buffer-layout";
import { RateLimiterConfig } from "../state/rateLimiter";
import * as Layout from "../utils/layout";
import { LendingInstruction } from "./instruction";

/// Sets the new owner of a lending market.
///
/// Accounts expected by this instruction:
///
///   0. `[writable]` Lending market account.
///   1. `[signer]` Current owner.
export const setLendingMarketOwnerAndConfigInstruction = (
  lendingMarket: PublicKey,
  currentMarketOwner: PublicKey,
  newMarketOwner: PublicKey,
  newRateLimiterConfig: RateLimiterConfig,
  riskAuthority: PublicKey,
  lendingProgramId: PublicKey,
  whitelistedLiquidator?: PublicKey
): TransactionInstruction => {
  const dataAccounts = [
    BufferLayout.u8("instruction"),
    Layout.publicKey("newOwner"),
    Layout.uint64("windowDuration"),
    Layout.uint64("maxOutflow"),
    BufferLayout.u8("whitelistedLiquidator"),
    Layout.publicKey("riskAuthority"),
  ]

  if (whitelistedLiquidator) {
    dataAccounts.splice(5, 0, Layout.publicKey("whitelistedLiquidatorPublicKey"))
  }

  const dataLayout = BufferLayout.struct(dataAccounts)

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.SetLendingMarketOwnerAndConfig,
      newOwner: newMarketOwner,
      windowDuration: newRateLimiterConfig.windowDuration,
      maxOutflow: newRateLimiterConfig.maxOutflow,
      whitelistedLiquidator: Number(Boolean(whitelistedLiquidator)),
      whitelistedLiquidatorPublicKey: whitelistedLiquidator,
      riskAuthority: riskAuthority,
    },
    data
  );

  const keys = [
    { pubkey: lendingMarket, isSigner: false, isWritable: true },
    { pubkey: currentMarketOwner, isSigner: true, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: lendingProgramId,
    data,
  });
};
