import { PublicKey } from '@solana/web3.js';

export const WAD = "1".concat(Array(18 + 1).join("0"));
export const WANG = "1".concat(Array(36 + 1).join("0"));
export const U64_MAX = "18446744073709551615";
export const SLOTS_PER_YEAR = 63072000;

export const SOLEND_DEVNET_PROGRAM_ID = new PublicKey("ALend7Ketfx5bxh6ghsCDXAoDrhvEmsXT3cynB6aPLgx");
export const SOLEND_BETA_PROGRAM_ID = new PublicKey("BLendhFh4HGnycEDDFhbeFEUYLP4fXB5tTHMoTX8Dch5");
