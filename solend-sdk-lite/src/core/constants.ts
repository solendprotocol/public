import { Cluster, PublicKey } from "@solana/web3.js";
export const WAD = "1".concat(Array(18 + 1).join("0"));
export const POSITION_LIMIT = 6;
export const SOL_PADDING_FOR_INTEREST = "1000000";
export const SLOTS_PER_YEAR = 63072000;
export const SOLEND_ADDRESSES = [
  "5pHk2TmnqQzRF9L6egy5FfiyBgS7G9cMZ5RFaJAvghzw",
  "yaDPAockQPna7Srx5LB2TugJSKHUduHghyZdQcn7zYz",
  "81KTtWjRndxGQbJHGJq6EaJWL8JfXbyywVvZReVPQd1X",
  "GDmSxpPzLkfxxr6dHLNRnCoYVGzvgc41tozkrr4pHTjB",
];
export const U64_MAX = "18446744073709551615";
export const NULL_ORACLE = new PublicKey(
  "nu11111111111111111111111111111111111111111"
);
export const SOLEND_PRODUCTION_PROGRAM_ID = new PublicKey(
  "So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo"
);
export const SOLEND_DEVNET_PROGRAM_ID = new PublicKey(
  "ALend7Ketfx5bxh6ghsCDXAoDrhvEmsXT3cynB6aPLgx"
);
export const SOLEND_BETA_PROGRAM_ID = new PublicKey(
  "BLendhFh4HGnycEDDFhbeFEUYLP4fXB5tTHMoTX8Dch5"
);

export function getProgramId(environment?: Cluster | "beta" | "production") {
  switch (environment) {
    case "mainnet-beta":
    case "production":
      return SOLEND_PRODUCTION_PROGRAM_ID;
      break;
    case "devnet":
      return SOLEND_DEVNET_PROGRAM_ID;
      break;
    case "beta":
      return SOLEND_BETA_PROGRAM_ID;
      break;
  }

  throw Error(`Unsupported environment: ${environment}`);
}
