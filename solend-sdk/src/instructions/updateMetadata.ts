import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { LendingInstruction } from "./instruction";

const BufferLayout = require("buffer-layout");

export const updateMetadataInstruction = (
  lendingMarket: PublicKey,
  lendingMarketOwner: PublicKey,
  lendingProgramId: PublicKey,
  marketName: string,
  marketDescription: string,
  marketImageUrl: string
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    BufferLayout.blob(50, "marketName"),
    BufferLayout.blob(250, "marketDescription"),
    BufferLayout.blob(250, "marketImageUrl"),
    BufferLayout.blob(200, "padding"),
    BufferLayout.u8("bumpSeed"),
  ]);

  const [lendingMarketMetadata, _] = findProgramAddressSync(
    [
      lendingMarket.toBytes(),
      Buffer.from(anchor.utils.bytes.utf8.encode("MetaData")),
    ],

    lendingProgramId
  );

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.UpdateMetadata,
      marketName,
      marketDescription,
      marketImageUrl,
      padding: Buffer.alloc(200),
    },
    data
  );

  const keys = [
    { pubkey: lendingMarket, isSigner: false, isWritable: false },
    { pubkey: lendingMarketOwner, isSigner: true, isWritable: false },
    { pubkey: lendingMarketMetadata, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];


  return new TransactionInstruction({
    keys,
    programId: lendingProgramId,
    data,
  });
};
