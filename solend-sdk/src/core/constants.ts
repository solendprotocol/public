import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { EnvironmentType } from "./types";
export const WAD = "1".concat(Array(18 + 1).join("0"));
export const POSITION_LIMIT = 6;
export const SOL_PADDING_FOR_INTEREST = "1000000";
export const MAIN_POOL_ADDRESS = new PublicKey(
  '4UpD2fh7xH3VP9QQaXtsS1YY3bxzWhtfpks7FatyKvdY',
);
export const SLOTS_PER_YEAR = 63072000;
export const WRAPPER_PROGRAM_ID =
  process.env.NEXT_PUBLIC_BRANCH === "eclipse"
    ? new PublicKey("55ttmJsE9v5PtScfnA2q6S9VXgSPopV6WziiwH94SYws")
    : new PublicKey("3JmCcXAjmBpFzHHuUpgJFfTQEQnAR7K1erNLtWV1g7d9");
export const SAVE_CREATOR = '5pHk2TmnqQzRF9L6egy5FfiyBgS7G9cMZ5RFaJAvghzw';
export const SOLEND_ADDRESSES = [
  SAVE_CREATOR,
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

export function getProgramId(environment?: EnvironmentType) {
  switch (environment) {
    case "mainnet-beta":
    case "production":
    case "eclipse":
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

export const BigZero = new BigNumber(0);
