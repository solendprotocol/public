import {
  Transaction,
  TransactionInstruction,
  PublicKey,
  Connection,
  TransactionSignature,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  Token,
} from "@solana/spl-token";
import { find, map } from "lodash";
import BN from "bn.js";

import {
  getTokenInfo,
  toBaseUnit,
  U64_MAX,
  getDecimals,
  tokenToCToken,
} from "../common";
import { createAndCloseWSOLAccount } from "./common";

import {
  parseObligation,
  withdrawObligationCollateralAndRedeemReserveLiquidity,
  refreshObligationInstruction,
  refreshReserveInstruction,
  getConfig,
} from "../..";
import loadReserve from "../reserve";

export async function withdraw(
  publicKey: PublicKey,
  sendTransaction: Function,
  amount: string,
  symbol: string,
  rpcEndpoint: string = "https://api.mainnet-beta.solana.com",
  environment: string = "production"
) {
  const connection = new Connection(rpcEndpoint, {
    commitment: "finalized",
  });
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

  let amountBase = amount;
  if (amount !== U64_MAX) {
    const reserveData = await loadReserve(symbol, rpcEndpoint, environment);

    const decimals = getDecimals(symbol);
    const tokenAmount = tokenToCToken(
      amount,
      reserveData.liquidity.availableAmount.toString(),
      reserveData.collateral.mintTotalSupply.toString(),
      decimals
    );
    amountBase = toBaseUnit(tokenAmount, symbol);
  }

  const tokenInfo = getTokenInfo(symbol);
  const oracleInfo = find(solendInfo.oracles.assets, { asset: symbol });
  if (!oracleInfo) {
    throw new Error(`Could not find oracle for ${symbol}`);
  }

  let ixs = [];
  let cleanupIxs: TransactionInstruction[] = [];

  const seed = lendingMarket!.address.slice(0, 32);
  const obligationAddress = await PublicKey.createWithSeed(
    publicKey,
    seed,
    new PublicKey(solendInfo.programID)
  );

  console.log(obligationAddress);
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

  const reservesToRefresh = depositReserves
    .concat(borrowReserves, [new PublicKey(reserve!.address)])
    .map((reserve) => reserve.toBase58());

  const reservesToRefreshDedupe = [...new Set(reservesToRefresh)].map(
    (reservePubkey) => new PublicKey(reservePubkey)
  );
  // Must refresh reserves for all collateral, borrows, and the reserve about to be repaid to
  reservesToRefreshDedupe.forEach((reserveAddress: PublicKey) => {
    const reserveInfo = find(lendingMarket!.reserves, {
      address: reserveAddress.toBase58(),
    });
    const oracleInfo = find(solendInfo.oracles.assets, {
      asset: reserveInfo!.asset,
    });
    const refreshReserveIx = refreshReserveInstruction(
      reserveAddress,
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

  const userCollateralAccountAddress = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    new PublicKey(reserve.collateralMintAddress),
    publicKey
  );

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
  const withdrawObligationCollateralAndRedeemReserveLiquidityIx =
    withdrawObligationCollateralAndRedeemReserveLiquidity(
      new BN(amountBase),
      new PublicKey(reserve.collateralSupplyAddress),
      userCollateralAccountAddress,
      new PublicKey(reserve.address),
      obligationAddress,
      new PublicKey(lendingMarket.address),
      new PublicKey(lendingMarket.authorityAddress),
      userTokenAccountAddress, // destinationLiquidity
      new PublicKey(reserve.collateralMintAddress),
      new PublicKey(reserve.liquidityAddress),
      publicKey, // obligationOwner
      publicKey, // transferAuthority
      programAddress
    );
  ixs.push(withdrawObligationCollateralAndRedeemReserveLiquidityIx);

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
