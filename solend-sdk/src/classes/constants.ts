import { PublicKey } from "@solana/web3.js";

export const WAD = "1".concat(Array(18 + 1).join("0"));
export const WANG = "1".concat(Array(36 + 1).join("0"));
export const U64_MAX = "18446744073709551615";
export const SLOTS_PER_YEAR = 63072000;

export const SOLEND_PRODUCTION_PROGRAM_ID = new PublicKey(
  "So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo"
);
export const SOLEND_DEVNET_PROGRAM_ID = new PublicKey(
  "ALend7Ketfx5bxh6ghsCDXAoDrhvEmsXT3cynB6aPLgx"
);
export const SOLEND_BETA_PROGRAM_ID = new PublicKey(
  "BLendhFh4HGnycEDDFhbeFEUYLP4fXB5tTHMoTX8Dch5"
);

export function getProgramId(environment?: string) {
  switch (environment) {
    case "production":
      return SOLEND_PRODUCTION_PROGRAM_ID;
      break;
    case "devnet":
      return SOLEND_DEVNET_PROGRAM_ID;
      break;
    case "beta":
      return SOLEND_BETA_PROGRAM_ID;
      break;
    default:
      return SOLEND_PRODUCTION_PROGRAM_ID;
  }

  throw Error(`Unsupported environment: ${environment}`);
}
