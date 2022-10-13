import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import * as BufferLayout from "buffer-layout";
import BN from "bn.js";
import * as Layout from "../utils/layout";
import { LendingInstruction } from "./instruction";

export const flashRepayReserveLiquidityInstruction = (
  liquidityAmount: number | BN,
  borrowInstructionIndex: number,
  sourceLiquidity: PublicKey,
  destinationLiquidity: PublicKey,
  reserveLiquidityFeeReceiver: PublicKey,
  hostFeeReceiver: PublicKey,
  reserve: PublicKey,
  lendingMarket: PublicKey,
  userTransferAuthority: PublicKey,
  lendingProgramId: PublicKey
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    Layout.uint64("liquidityAmount"),
    BufferLayout.u8("borrowInstructionIndex"),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.FlashRepayReserveLiquidity,
      liquidityAmount: new BN(liquidityAmount),
      borrowInstructionIndex: borrowInstructionIndex,
    },
    data
  );

  const keys = [
    { pubkey: sourceLiquidity, isSigner: false, isWritable: true },
    { pubkey: destinationLiquidity, isSigner: false, isWritable: true },
    { pubkey: reserveLiquidityFeeReceiver, isSigner: false, isWritable: true },
    { pubkey: hostFeeReceiver, isSigner: false, isWritable: true },
    { pubkey: reserve, isSigner: false, isWritable: false },
    { pubkey: lendingMarket, isSigner: false, isWritable: false },
    { pubkey: userTransferAuthority, isSigner: true, isWritable: false },
    { pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: lendingProgramId,
    data,
  });
};
