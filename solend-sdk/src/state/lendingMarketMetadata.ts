import { AccountInfo, PublicKey } from "@solana/web3.js";
import * as fzstd from "fzstd";
import * as Layout from "../layout";
import * as anchor from "@coral-xyz/anchor";

const BufferLayout = require("buffer-layout");

export const LendingMarketMetadataLayout: typeof BufferLayout.Structure =
  BufferLayout.struct([
    BufferLayout.u8("bumpSeed"),
    BufferLayout.blob(50, "marketName"),
    BufferLayout.blob(300, "marketDescription"),
    BufferLayout.blob(250, "marketImageUrl"),
    BufferLayout.blob(32*4, "lookupTables"),
    BufferLayout.blob(100, "padding"),
  ]);

export interface LendingMarketMetadata {
  bumpSeed: number;
  marketName: string;
  marketDescription: string;
  marketImageUrl: string;
  lookupTables: Buffer;
}

export type ParsedLendingMarketMetadata = ReturnType<typeof parseLendingMarketMetadata>;

export const LENDING_MARKET_METADATA_SIZE = LendingMarketMetadataLayout.span;

function trimString(array: Uint8Array): string {
  const firstEndingZeroIndex = array.findIndex((value, index) => value === 0 && array.slice(index).every(v => v === 0));
  const trimmedArray = firstEndingZeroIndex === -1 ? array : array.slice(0, firstEndingZeroIndex);
  return anchor.utils.bytes.utf8.decode(trimmedArray);
}

export const parseLendingMarketMetadata = (
  pubkey: PublicKey,
  info: AccountInfo<Buffer>,
  encoding?: string
) => {
  if (encoding === "base64+zstd") {
    info.data = Buffer.from(fzstd.decompress(info.data));
  }
  const { data } = info;
  const buffer = Buffer.from(data);
  const lendingMarketMetadata = LendingMarketMetadataLayout.decode(buffer) as LendingMarketMetadata;

  const lookupTables = BufferLayout.seq(Layout.publicKey(), 4).decode(lendingMarketMetadata.lookupTables);
  
  const details = {
    pubkey,
    account: {
      bumpSeed: lendingMarketMetadata.bumpSeed,
      marketName: trimString(Buffer.from(lendingMarketMetadata.marketName)),
      marketDescription: trimString(Buffer.from(lendingMarketMetadata.marketDescription)),
      marketImageUrl: trimString(Buffer.from(lendingMarketMetadata.marketImageUrl)),
      lookupTables,
    },
    info: lendingMarketMetadata,
  };

  return details;
};
