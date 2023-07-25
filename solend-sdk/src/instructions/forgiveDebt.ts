import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import * as BufferLayout from "buffer-layout";
import * as Layout from "../utils/layout";
import { LendingInstruction } from "./instruction";
import BN from "bn.js";

export const forgiveDebtInstruction = (
  obligation: PublicKey,
  reserve: PublicKey,
  lendingMarket: PublicKey,
  lendingMarketOwner: PublicKey,
  liquidityAmount: number | BN,
  lendingProgramId: PublicKey
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    Layout.uint64("liquidityAmount"),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.ForgiveDebt,
      liquidityAmount: new BN(liquidityAmount),
    },
    data
  );

  const keys = [
    { pubkey: obligation, isSigner: false, isWritable: true },
    { pubkey: reserve, isSigner: false, isWritable: true },
    { pubkey: lendingMarket, isSigner: false, isWritable: false },
    { pubkey: lendingMarketOwner, isSigner: true, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: lendingProgramId,
    data,
  });
};
