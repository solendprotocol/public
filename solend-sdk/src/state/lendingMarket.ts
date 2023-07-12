import { AccountInfo, PublicKey } from "@solana/web3.js";
import * as fzstd from "fzstd";
import * as Layout from "../utils/layout";
import { RateLimiter, RateLimiterLayout } from "./rateLimiter";

const BufferLayout = require("buffer-layout");

export interface LendingMarket {
  version: number;
  bumpSeed: number;
  owner: PublicKey;
  quoteTokenMint: PublicKey;
  tokenProgramId: PublicKey;
  oracleProgramId: PublicKey;
  switchboardOracleProgramId: PublicKey;
  rateLimiter: RateLimiter;
  whitelistedLiquidator: PublicKey | null;
  riskAuthority: PublicKey;
}

export const LendingMarketLayout: typeof BufferLayout.Structure =
  BufferLayout.struct([
    BufferLayout.u8("version"),
    BufferLayout.u8("bumpSeed"),
    Layout.publicKey("owner"),
    Layout.publicKey("quoteTokenMint"),
    Layout.publicKey("tokenProgramId"),
    Layout.publicKey("oracleProgramId"),
    Layout.publicKey("switchboardOracleProgramId"),
    RateLimiterLayout,
    Layout.publicKey("whitelistedLiquidator"),
    Layout.publicKey("riskAuthority"),
    BufferLayout.blob(8, "padding"),
  ]);

export const LENDING_MARKET_SIZE = LendingMarketLayout.span;

export const isLendingMarket = (info: AccountInfo<Buffer>) =>
  info.data.length === LendingMarketLayout.span;

export const parseLendingMarket = (
  pubkey: PublicKey,
  info: AccountInfo<Buffer>,
  encoding?: string
) => {
  if (encoding === "base64+zstd") {
    info.data = Buffer.from(fzstd.decompress(info.data));
  }
  const { data } = info;
  const buffer = Buffer.from(data);
  const lendingMarket = LendingMarketLayout.decode(buffer) as LendingMarket;

  const details = {
    pubkey,
    account: {
      ...info,
    },
    info: lendingMarket,
  };

  return details;
};
