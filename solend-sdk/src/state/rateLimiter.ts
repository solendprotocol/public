import * as Layout from "../utils/layout";
import BN from "bn.js";
const BufferLayout = require("buffer-layout");

export const RATE_LIMITER_LEN = 56;
export interface RateLimiter {
  config: RateLimiterConfig;
  previousQuantity: BN;
  windowStart: BN;
  currentQuantity: BN;
}

export interface RateLimiterConfig {
  windowDuration: BN;
  maxOutflow: BN;
}

export const RateLimiterLayout = BufferLayout.struct(
  [
    BufferLayout.struct(
      [Layout.uint64("maxOutflow"), Layout.uint64("windowDuration")],
      "config"
    ),
    Layout.uint128("previousQuantity"),
    Layout.uint64("windowStart"),
    Layout.uint128("currentQuantity"),
  ],
  "rateLimiter"
);
