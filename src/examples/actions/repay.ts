import {
  Transaction,
  TransactionInstruction,
  PublicKey,
  Connection,
  TransactionSignature,
} from "@solana/web3.js";
import {
  Token,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { find, map, union } from "lodash";
import BN from "bn.js";

import { getTokenInfo, toBaseUnit, U64_MAX } from "../common";
import { createAndCloseWSOLAccount } from "./common";

import {
  parseObligation,
  repayObligationLiquidityInstruction,
  refreshObligationInstruction,
  refreshReserveInstruction,
  getConfig,
} from "../..";

export async function repay(
  publicKey: PublicKey,
  sendTransaction: Function,
  amount: string,
  symbol: string,
  userBorrowAmount: string, // user total borrow amount for purpose of max repay
  rpcEndpoint: string = "https://api.mainnet-beta.solana.com"
) {
  const connection = new Connection(rpcEndpoint, {
    commitment: "finalized",
  });
  const amountBase = toBaseUnit(amount, symbol);
  const solendInfo = getConfig();
  const programAddress = new PublicKey(solendInfo.programID);
  const lendingMarket = find(solendInfo.markets, {
    name: "main",
  });
  if (!lendingMarket) {
    throw new Error("Could not find main lending market");
  }
  const reserve = find(lendingMarket!.reserves, { asset: symbol });
  if (!reserve) {
    throw new Error(`Could not find asset ${symbol} in reserves`);
  }
  const tokenInfo = getTokenInfo(symbol);

  let ixs = [];
  let cleanupIxs: TransactionInstruction[] = [];

  const seed = lendingMarket!.address.slice(0, 32);
  const obligationAddress = await PublicKey.createWithSeed(
    publicKey,
    seed,
    new PublicKey(solendInfo.programID)
  );
  const obligationAccountInfo = await connection.getAccountInfo(
    obligationAddress
  );
  if (!obligationAccountInfo) {
    throw new Error(`Obligation ${obligationAddress.toBase58()} doesn't exist`);
  }
  const rawObligationData = await connection.getAccountInfo(obligationAddress);
  const obligationDetails = parseObligation(
    PublicKey.default,
    rawObligationData!
  )!.info;
  const depositReserves = map(
    obligationDetails.deposits,
    (deposit) => deposit.depositReserve
  );
  const borrowReserves = map(
    obligationDetails.borrows,
    (borrow) => borrow.borrowReserve
  );
  console.log(
    "depositReserves",
    map(depositReserves, (e) => e.toBase58())
  );
  console.log(
    "borrowReserves",
    map(borrowReserves, (e) => e.toBase58())
  );
  // Must refresh reserves for all collateral, borrows, and the reserve about to be repaid to
  const allReserveAddresses = union(
    // Union of strings, so they can be compared properly (unlike PublicKeys)
    map(depositReserves, (e) => e.toBase58()),
    map(borrowReserves, (e) => e.toBase58()),
    [reserve!.address]
  );
  allReserveAddresses.forEach((reserveAddress) => {
    const reserveInfo = find(lendingMarket!.reserves, {
      address: reserveAddress,
    });
    const oracleInfo = find(solendInfo.oracles.assets, {
      asset: reserveInfo!.asset,
    });
    const refreshReserveIx = refreshReserveInstruction(
      new PublicKey(reserveAddress),
      new PublicKey(oracleInfo!.priceAddress),
      new PublicKey(oracleInfo!.switchboardFeedAddress)
    );
    ixs.push(refreshReserveIx);
  });

  const refreshObligationIx = refreshObligationInstruction(
    obligationAddress,
    depositReserves,
    borrowReserves,
    programAddress
  );
  ixs.push(refreshObligationIx);

  if (symbol === "SOL") {
    let safeAmountBase = amountBase;

    if (amountBase === U64_MAX) {
      // Wrap a little extra amount for for the interest that could
      // accrue in the actual max amount being repaid
      const PADDING_FOR_INTEREST = toBaseUnit("0.001", symbol);

      safeAmountBase = new BN(toBaseUnit(userBorrowAmount, symbol))
        .add(new BN(PADDING_FOR_INTEREST))
        .toString();
    }

    const [createWSOLAccountIxs, closeWSOLAccountIxs] =
      await createAndCloseWSOLAccount(
        connection,
        publicKey,
        sendTransaction,
        safeAmountBase
      );
    ixs = ixs.concat(createWSOLAccountIxs);
    cleanupIxs = cleanupIxs.concat(closeWSOLAccountIxs);
  }

  const userTokenAccountAddress = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    new PublicKey(tokenInfo!.mintAddress),
    publicKey
  );
  const repayObligationLiquidityIx = repayObligationLiquidityInstruction(
    new BN(amountBase),
    userTokenAccountAddress,
    new PublicKey(reserve!.liquidityAddress),
    new PublicKey(reserve!.address),
    obligationAddress,
    new PublicKey(lendingMarket!.address),
    publicKey,
    programAddress
  );
  ixs.push(repayObligationLiquidityIx);

  const tx = new Transaction().add(...ixs, ...cleanupIxs);
  const { blockhash } = await connection.getRecentBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = publicKey;
  let signature: TransactionSignature = "";

  signature = await sendTransaction(tx, connection);
  console.log(`submitted tx ${signature}`);
  await connection.confirmTransaction(signature);
  console.log(`confirmed tx ${signature}`);
  return signature;
}
