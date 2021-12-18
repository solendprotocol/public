import {
  Transaction,
  TransactionInstruction,
  PublicKey,
  SystemProgram,
  TransactionSignature,
  Connection,
} from "@solana/web3.js";
import {
  Token,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { find, map, union } from "lodash";
import BN from "bn.js";
import { getTokenInfo, toBaseUnit } from "../common";
import { createAndCloseWSOLAccount } from "./common";

import {
  parseObligation,
  OBLIGATION_SIZE,
  borrowObligationLiquidityInstruction,
  refreshObligationInstruction,
  refreshReserveInstruction,
  initObligationInstruction,
  getConfig,
} from "../..";

export async function borrow(
  publicKey: PublicKey,
  sendTransaction: Function,
  amount: string,
  symbol: string,
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

  const obligationInfoRentExempt =
    await connection.getMinimumBalanceForRentExemption(OBLIGATION_SIZE);
  const seed = lendingMarket!.address.slice(0, 32);
  const obligationAddress = await PublicKey.createWithSeed(
    publicKey,
    seed,
    programAddress
  );
  const obligationAccountInfo = await connection.getAccountInfo(
    obligationAddress
  );
  if (!obligationAccountInfo) {
    console.log(`Creating new obligation ${obligationAddress}`);
    ixs.push(
      SystemProgram.createAccountWithSeed({
        fromPubkey: publicKey,
        newAccountPubkey: obligationAddress,
        basePubkey: publicKey,
        seed,
        lamports: obligationInfoRentExempt,
        space: OBLIGATION_SIZE,
        programId: new PublicKey(solendInfo.programID),
      })
    );
    const initObligationIx = initObligationInstruction(
      obligationAddress,
      new PublicKey(lendingMarket.address),
      publicKey,
      programAddress
    );
    ixs.push(initObligationIx);
  } else {
    console.log(`Obligation account ${obligationAddress} already exists`);
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
  const allReserveAddresses = union(
    // Union of strings, so they can be compared properly (unlike PublicKeys)
    map(depositReserves, (e) => e.toBase58()),
    map(borrowReserves, (e) => e.toBase58()),
    [reserve!.address]
  );
  console.log("all reserves", allReserveAddresses);
  // Must refresh reserves for all collateral, borrows, and the reserve about to be borrowed from
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
    const [createWSOLAccountIxs, closeWSOLAccountIxs] =
      await createAndCloseWSOLAccount(
        connection,
        publicKey,
        sendTransaction,
        "0"
      );
    ixs = ixs.concat(createWSOLAccountIxs);
    cleanupIxs = cleanupIxs.concat(closeWSOLAccountIxs);
  }

  // Get or create user token account
  const userTokenAccountAddress = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    new PublicKey(tokenInfo!.mintAddress),
    publicKey
  );
  const userTokenAccountInfo = await connection.getAccountInfo(
    userTokenAccountAddress
  );
  // If token is SOL, we don't want to create the account here because we just created it above
  if (symbol !== "SOL" && !userTokenAccountInfo) {
    const createUserTokenAccountIx =
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        new PublicKey(tokenInfo!.mintAddress),
        userTokenAccountAddress,
        publicKey,
        publicKey
      );
    ixs.push(createUserTokenAccountIx);
  }

  const borrowObligationLiquidityIx = borrowObligationLiquidityInstruction(
    new BN(amountBase),
    new PublicKey(reserve!.liquidityAddress),
    userTokenAccountAddress,
    new PublicKey(reserve.address),
    new PublicKey(reserve!.liquidityFeeReceiverAddress),
    obligationAddress,
    new PublicKey(lendingMarket.address), // lendingMarket
    new PublicKey(lendingMarket.authorityAddress), // lendingMarketAuthority
    publicKey,
    programAddress
  );
  ixs.push(borrowObligationLiquidityIx);

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
