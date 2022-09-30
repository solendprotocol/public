import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import * as BufferLayout from "buffer-layout";
import BN from "bn.js";
import * as Layout from "../utils/layout";
import { LendingInstruction } from "./instruction";

export const flashBorrowReserveLiquidityInstruction = (
  liquidityAmount: number | BN,
  sourceLiquidity: PublicKey,
  destinationLiquidity: PublicKey,
  reserve: PublicKey,
  lendingMarket: PublicKey,
  lendingProgramId: PublicKey
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    Layout.uint64("liquidityAmount"),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.FlashBorrowReserveLiquidity,
      liquidityAmount: new BN(liquidityAmount),
    },
    data
  );

  const [lendingMarketAuthority, _] = findProgramAddressSync(
    [lendingMarket.toBytes()],
    lendingProgramId
  );

  const keys = [
    { pubkey: sourceLiquidity, isSigner: false, isWritable: true },
    { pubkey: destinationLiquidity, isSigner: false, isWritable: true },
    { pubkey: reserve, isSigner: false, isWritable: true },
    { pubkey: lendingMarket, isSigner: false, isWritable: false },
    { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: lendingProgramId,
    data,
  });
};
