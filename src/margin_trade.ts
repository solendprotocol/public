/* eslint-disable no-unused-vars */
import {
  Connection,
  Keypair,
  Transaction,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { SolendMarket } from "../src/"
import bs58 from "bs58";

const SOLANA_RPC_ENDPOINT = "https://solana-api.projectserum.com";
const OBLIGATION = new PublicKey(
  "HQNn9kb7QyCuu2QxuE6yd8cJRebpBq824cu1gM6gRRVb"
);

const WALLET_PRIVATE_KEY: number[] = JSON.parse(process.env.WALLET_PRIVATE_KEY || "[]");
export const USER_KEYPAIR = Keypair.fromSecretKey(Uint8Array.from(WALLET_PRIVATE_KEY));

const main = async () => {
  const connection = new Connection(SOLANA_RPC_ENDPOINT);
  const market = await SolendMarket.initialize(connection, "beta", "HB1cecsgnFPBfKxEDfarVtKXEARWuViJKCqztWiFB3Uk");
  console.log(market);
  // let tx = new Transaction();
  // tx.add(
  //   flashBorrowReserveLiquidityInstruction(
  //     100,
  //     new PublicKey(reserve.config.liquidityAddress),
  //     tokenAccount,
  //     new PublicKey(reserve.config.address),
  //     new PublicKey(market.config!.address),
  //     SOLEND_DEVNET_PROGRAM_ID
  //   ),
  //   flashRepayReserveLiquidityInstruction(
  //     100,
  //     0,
  //     tokenAccount,
  //     new PublicKey(reserve.config.liquidityAddress),
  //     new PublicKey(reserve.config.liquidityFeeReceiverAddress),
  //     tokenAccount,
  //     new PublicKey(reserve.config.address),
  //     new PublicKey(market.config!.address),
  //     delegate.publicKey,
  //     SOLEND_DEVNET_PROGRAM_ID
  //   )
  // );
  // await connection.sendTransaction(tx, [payer]);
};

main();
