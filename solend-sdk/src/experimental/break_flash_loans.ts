/* eslint-disable no-unused-vars */
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  SOLEND_BETA_PROGRAM_ID,
  SolendMarket,
  flashBorrowReserveLiquidityInstruction,
  flashRepayReserveLiquidityInstruction,
} from "../../dist";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const SOLANA_RPC_ENDPOINT =
  "https://solend.rpcpool.com/a3e03ba77d5e870c8c694b19d61c";

const connection = new Connection(SOLANA_RPC_ENDPOINT);

const WALLET_PRIVATE_KEY: number[] = JSON.parse(
  process.env.WALLET_PRIVATE_KEY || "[]"
);
export const USER_KEYPAIR = Keypair.fromSecretKey(
  Uint8Array.from(WALLET_PRIVATE_KEY)
);

const getATA = async (mintAddress: PublicKey, owner: PublicKey) => {
  return Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mintAddress,
    owner
  );
};

const main = async () => {
  const payer = USER_KEYPAIR;

  const lendingMarketKey = new PublicKey(
    "HB1cecsgnFPBfKxEDfarVtKXEARWuViJKCqztWiFB3Uk"
  );

  // main pool
  const market = await SolendMarket.initialize(
    connection,
    "beta",
    lendingMarketKey.toString()
  );

  const solReserve = market.reserves.find(
    (res) => res.config.liquidityToken.symbol == "SOL"
  );
  const msolReserve = market.reserves.find(
    (res) => res.config.liquidityToken.symbol == "mSOL"
  );

  if (!solReserve || !msolReserve) {
    console.log("Can't find both reserves.");
    return;
  }
  console.log(solReserve!.config.address);

  // turbo sol pool
  const marketTurbo = await SolendMarket.initialize(
    connection,
    "beta",
    "Az4MpWtMcpENQZwbEbTnrgyd2qk3wsMwQXimadUiHSQp"
  );
  const solReserveTurbo =
    marketTurbo.reserves.find(
      (res) => res.config.liquidityToken.symbol == "SOL"
    ) ?? null;

  if (!solReserveTurbo) {
    console.log("Can't find turbo sol reserve");
    return;
  }

  const solATA = await getATA(
    new PublicKey(solReserve.config.liquidityToken.mint),
    payer.publicKey
  );

  console.log(solReserveTurbo.config.liquidityAddress);

  const tx = new Transaction();

  tx.add(
    flashBorrowReserveLiquidityInstruction(
      // liquidity amount
      1e9,

      // source liquidity
      new PublicKey(solReserve.config.liquidityAddress),

      // destination liquidity
      solATA,

      // reserve address
      new PublicKey(solReserve.config.address),

      // lending market address
      new PublicKey(market.config.address),

      // program id
      SOLEND_BETA_PROGRAM_ID
    ),
    flashRepayReserveLiquidityInstruction(
      // liquidity amount
      1e9,

      // index of flash borrow instruction
      0,

      // source liquidity
      solATA,

      // destination liquidity
      new PublicKey(solReserve.config.liquidityAddress),

      // fee receiver
      new PublicKey(solReserve.config.liquidityFeeReceiverAddress),

      // host fees
      solATA,

      // reserve address
      new PublicKey(solReserve.config.address),

      // lending market address
      new PublicKey(market.config!.address),

      // user transfer authority
      payer.publicKey,

      // program id
      SOLEND_BETA_PROGRAM_ID
    )
  );

  const sig = await connection.sendTransaction(tx, [payer]);
  console.log(`https://solscan.io/tx/${sig}`);

  await connection.confirmTransaction(sig);
};

main();
