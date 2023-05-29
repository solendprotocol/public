import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import * as Layout from "../utils/layout";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { LendingInstruction } from "./instruction";
import { SYSTEM_PROGRAM_ID } from "@marinade.finance/marinade-ts-sdk/dist/src/util";

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

  const [lendingMarketMetadata, bumpSeed] = findProgramAddressSync(
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
    { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: lendingProgramId,
    data,
  });
};
