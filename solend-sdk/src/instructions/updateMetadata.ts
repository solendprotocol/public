import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import * as Layout from "../layout";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { LendingInstruction } from "./instruction";

const BufferLayout = require("buffer-layout");

export const updateMetadataInstruction = (
  lendingMarket: PublicKey,
  lendingMarketOwner: PublicKey,
  lendingProgramId: PublicKey,
  marketName: string,
  marketDescription: string,
  marketImageUrl: string,
  lookupTables: PublicKey[],
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    BufferLayout.u8("bumpSeed"),
    BufferLayout.blob(50, "marketName"),
    BufferLayout.blob(300, "marketDescription"),
    BufferLayout.blob(250, "marketImageUrl"),
    ...Array(4).fill(0).map((_i, index) => Layout.publicKey(`lookupTables${index}`)),
    BufferLayout.blob(100, "padding"),
  ]);

  const [lendingMarketMetadata, bumpSeed] = findProgramAddressSync(
    [
      lendingMarket.toBytes(),
      Buffer.from(anchor.utils.bytes.utf8.encode("MetaData")),
    ],

    lendingProgramId
  );

  const marketNameBuffer = Buffer.alloc(50, 0); // Fills with zeros
  Buffer.from(anchor.utils.bytes.utf8.encode(marketName)).copy(marketNameBuffer);

  const marketDescriptionBuffer = Buffer.alloc(300, 0); // Fills with zeros
  Buffer.from(anchor.utils.bytes.utf8.encode(marketDescription)).copy(marketDescriptionBuffer);

  const marketImageUrlBuffer = Buffer.alloc(250, 0); // Fills with zeros
  Buffer.from(anchor.utils.bytes.utf8.encode(marketImageUrl)).copy(marketImageUrlBuffer);

  const data = Buffer.alloc(dataLayout.span);


  const encodedLookupTables = {
    lookupTables0: lookupTables[0],
    lookupTables1: lookupTables[1],
    lookupTables2: lookupTables[2],
    lookupTables3: lookupTables[3],
  }

  dataLayout.encode(
    {
      bumpSeed,
      instruction: LendingInstruction.UpdateMetadata,
      marketName: marketNameBuffer,
      marketDescription: marketDescriptionBuffer,
      marketImageUrl: marketImageUrlBuffer,
      ...encodedLookupTables,
      padding: Buffer.alloc(100),
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
