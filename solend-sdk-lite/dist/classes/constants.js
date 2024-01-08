"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProgramId =
  exports.SOLEND_BETA_PROGRAM_ID =
  exports.SOLEND_DEVNET_PROGRAM_ID =
  exports.SOLEND_PRODUCTION_PROGRAM_ID =
  exports.NULL_ORACLE =
  exports.U64_MAX =
    void 0;
const web3_js_1 = require("@solana/web3.js");
exports.U64_MAX = "18446744073709551615";
exports.NULL_ORACLE = new web3_js_1.PublicKey(
  "nu11111111111111111111111111111111111111111"
);
exports.SOLEND_PRODUCTION_PROGRAM_ID = new web3_js_1.PublicKey(
  "So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo"
);
exports.SOLEND_DEVNET_PROGRAM_ID = new web3_js_1.PublicKey(
  "ALend7Ketfx5bxh6ghsCDXAoDrhvEmsXT3cynB6aPLgx"
);
exports.SOLEND_BETA_PROGRAM_ID = new web3_js_1.PublicKey(
  "BLendhFh4HGnycEDDFhbeFEUYLP4fXB5tTHMoTX8Dch5"
);
function getProgramId(environment) {
  switch (environment) {
    case "mainnet-beta":
    case "production":
      return exports.SOLEND_PRODUCTION_PROGRAM_ID;
      break;
    case "devnet":
      return exports.SOLEND_DEVNET_PROGRAM_ID;
      break;
    case "beta":
      return exports.SOLEND_BETA_PROGRAM_ID;
      break;
  }
  throw Error(`Unsupported environment: ${environment}`);
}
exports.getProgramId = getProgramId;
