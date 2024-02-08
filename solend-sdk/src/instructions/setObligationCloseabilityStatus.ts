import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { LendingInstruction } from "./instruction";

const BufferLayout = require("buffer-layout");

export const setObligationCloseabilityStatus = (
obligation: PublicKey,
  lendingMarket: PublicKey,
  reserve: PublicKey,
  riskAuthority: PublicKey,
  closeable: boolean,
  lendingProgramId: PublicKey,
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    BufferLayout.u8("closeable"),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.SetObligationCloseabilityStatus,
      closeable: closeable ? 1 : 0,
    },
    data
  );

  const keys = [
    { pubkey: obligation, isSigner: false, isWritable: true },
    { pubkey: lendingMarket, isSigner: false, isWritable: false },
    { pubkey: reserve, isSigner: false, isWritable: false },
    { pubkey: riskAuthority, isSigner: true, isWritable: true },
  ];

  return new TransactionInstruction({
    keys,
    programId: lendingProgramId,
    data,
  });
};
