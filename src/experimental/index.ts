/* eslint-disable no-unused-vars */
import JSBI from "jsbi";
import { readFileSync } from "fs";
import path from "path";
import {
  Marinade,
  MarinadeConfig,
  Wallet,
  Provider,
} from "@marinade.finance/marinade-ts-sdk";
import {
  Connection,
  Keypair,
  Transaction,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  SOLEND_BETA_PROGRAM_ID,
  flashBorrowReserveLiquidityInstruction,
  flashRepayReserveLiquidityInstruction,
  depositReserveLiquidityAndObligationCollateralInstruction,
  borrowObligationLiquidityInstruction,
  refreshReserveInstruction,
  refreshObligationInstruction,
  parseLendingMarket,
  parseReserve,
  parseObligation,
  repayObligationLiquidityInstruction,
  withdrawObligationCollateralAndRedeemReserveLiquidity,
  initObligationInstruction,
  BNumber,
  syncNative,
  obligationToString,
} from "../../dist";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Jupiter,
  SwapMode,
  TOKEN_LIST_URL,
  WRAPPED_SOL_MINT,
} from "@jup-ag/core";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import Decimal from "decimal.js";
import BN from "bn.js";
import { SYSTEM_PROGRAM_ID } from "@marinade.finance/marinade-ts-sdk/dist/src/util";
import BigNumber from "bignumber.js";

const NULL_PUBKEY = new PublicKey(
  "nu11111111111111111111111111111111111111111"
);

const SOLANA_RPC_ENDPOINT =
  "https://solend.rpcpool.com/a3e03ba77d5e870c8c694b19d61c";

const connection = new Connection(SOLANA_RPC_ENDPOINT);

// const WALLET_PRIVATE_KEY: number[] = JSON.parse(
//   process.env.WALLET_PRIVATE_KEY || "[]"
// );
// export const USER_KEYPAIR = Keypair.fromSecretKey(
//   Uint8Array.from(WALLET_PRIVATE_KEY)
// );

const readKeyfile = (filePath: string): Keypair => {
  if (filePath[0] == "~") {
    filePath = path.join(process.env.HOME as string, filePath.slice(1));
  }

  return Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(readFileSync(filePath, { encoding: "utf-8" })))
  );
};

export const USER_KEYPAIR = readKeyfile("~/.config/solana/id.json");

const wallet = new Wallet(USER_KEYPAIR);
const config = new MarinadeConfig({
  connection,
  publicKey: wallet.publicKey,
  // referralCode: new PublicKey("SLN6aJmT5rP8cfeGnGNAQGJkyhA8oNQ2tP8AXX5TEcW"),
});
const marinade = new Marinade(config);

const U64_MAX = new BN("18446744073709551615"); // jank life
const AMM = "Orca";

type LendingMarket = ReturnType<typeof parseLendingMarket>;
type Reserve = ReturnType<typeof parseReserve>;
type Obligation = ReturnType<typeof parseObligation>;

const getATA = async (mintAddress: PublicKey, owner: PublicKey) => {
  return Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mintAddress,
    owner
  );
};

interface Strategy {
  slug: string;
  liquidityMint: PublicKey;
  collateralMint: PublicKey;
}

const preLever = async (
  owner: PublicKey,
  lendingMarket: PublicKey,
  programId: PublicKey,
  strategy: string = "msol-sol"
) => {
  const seed = `${strategy}${lendingMarket.toString()}`.slice(0, 32);
  console.log(`Seed is ${seed}`);

  const obligationAddress = await PublicKey.createWithSeed(
    owner,
    seed,
    programId
  );
  console.log(obligationAddress.toString());
  const tx = new Transaction();

  if (!(await connection.getAccountInfo(obligationAddress))) {
    tx.add(
      SystemProgram.createAccountWithSeed({
        fromPubkey: owner,
        newAccountPubkey: obligationAddress,
        basePubkey: owner,
        seed: seed,
        lamports: await connection.getMinimumBalanceForRentExemption(1300),
        space: 1300,
        programId: programId,
      })
    );
    tx.add(
      initObligationInstruction(
        obligationAddress,
        new PublicKey(lendingMarket),
        owner,
        programId
      )
    );
  }

  const mints = [
    new PublicKey("So11111111111111111111111111111111111111112"),
    new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"),
    new PublicKey("5h6ssFpeDeRbzsEHDbTQNH7nVGgsKrZydxdSTnLm6QdV"), // csol
    new PublicKey("3JFC4cB56Er45nWVe29Bhnn5GnwQzSmHVf6eUq9ac91h"), // cmsol
  ];
  for (const mint of mints) {
    const tokenAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      owner,
      true
    );

    if (!(await connection.getAccountInfo(tokenAccount))) {
      tx.add(
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          mint,
          tokenAccount,
          owner,
          owner
        )
      );
    }
  }

  const kp = new Keypair();
  const wsolTokenAccountExtra = kp.publicKey;
  tx.add(
    SystemProgram.createAccount({
      fromPubkey: owner,
      newAccountPubkey: wsolTokenAccountExtra,
      lamports: await connection.getMinimumBalanceForRentExemption(165),
      space: 165,
      programId: TOKEN_PROGRAM_ID,
    })
  );
  tx.add(
    Token.createInitAccountInstruction(
      TOKEN_PROGRAM_ID,
      WRAPPED_SOL_MINT,
      wsolTokenAccountExtra,
      owner
    )
  );

  return {
    preLeverTx: tx,
    obligationAddress: obligationAddress,
    wsolTokenAccountExtra: wsolTokenAccountExtra,
    extraKeyPair: kp,
  };
};

// inputAmount: quantity of msol tokens in fractional units (eg 1e9 => 1 whole mSOL)
const calculateFlashLoanAndDepositAmount = (
  inputAmount: number,
  targetUtil: BigNumber,
  stakedSolToSolPrice: number
): [BN, BN] => {
  // calculate flash loan amount assuming target util of 80%
  // flashLoanAmount / (flashLoanAmount + inputAmount * msol-sol) = ltv
  // flashLoanAmount * ltv + inputAmount * msol-sol * ltv = flashLoanAmount
  // flashLoanAmount = inputAmount * msol-sol * ltv / (1 - ltv)
  // eg 80% util, 1 msol => flashLoanAmount = 1 * 1.05 * 0.8 / (0.2) = 4.2SOL
  // 4.2SOL / (1msol + 4.2 SOL) = 4.2 / (1.05 + 4.2)
  const stakedSolToSolPriceBN = new BigNumber(stakedSolToSolPrice);

  const flashLoanAmount = new BigNumber(inputAmount)
    .multipliedBy(stakedSolToSolPriceBN)
    .multipliedBy(targetUtil)
    .dividedBy(new BigNumber(1).minus(targetUtil));

  const msolDepositAmount = new BigNumber(inputAmount).plus(
    flashLoanAmount.dividedBy(stakedSolToSolPriceBN)
  );

  // console.log("input amount ", inputAmount);
  console.log("flash loan ", flashLoanAmount.toNumber() / 1e9, "sol");
  // console.log("msol price ", stakedSolToSolPrice);
  // console.log("msoldeposit amount", msolDepositAmount.toNumber(), "sol tokens");

  return [
    new BN(Math.ceil(flashLoanAmount.toNumber())),
    new BN(Math.floor(msolDepositAmount.toNumber())),
  ];
};

const lever = async (
  lendingProgramId: PublicKey,
  lendingMarket: LendingMarket,
  longReserve: Reserve,
  longReservePyth: PublicKey,
  longReserveSwitchboard: PublicKey,
  shortReserve: Reserve,
  shortReservePyth: PublicKey,
  shortReserveSwitchboard: PublicKey,
  obligation: Obligation,
  inputAmount: number, // quantity of mSOL in user's wallet in fractional units (eg 1e9 => 1 "whole" msol)
  wsolTokenAccountExtra: PublicKey
) => {
  if (longReserve == null || shortReserve == null || obligation == null) {
    throw "1";
  }

  const payer = obligation.info.owner;

  const msol_sol = (await marinade.getMarinadeState()).mSolPrice;
  const [flashLoanAmount, msolDepositAmount] =
    calculateFlashLoanAndDepositAmount(
      inputAmount,
      new BigNumber(0.75),
      msol_sol
    );

  const longReserveLiquidityAta = await getATA(
    longReserve.info.liquidity.mintPubkey,
    payer
  );
  const shortReserveLiquidityAta = await getATA(
    shortReserve.info.liquidity.mintPubkey,
    payer
  );

  const longReserveCollateralAta = await getATA(
    longReserve.info.collateral.mintPubkey,
    payer
  );

  const tx = new Transaction();
  tx.add(
    flashBorrowReserveLiquidityInstruction(
      flashLoanAmount,
      new PublicKey(shortReserve.info.liquidity.supplyPubkey),
      wsolTokenAccountExtra,
      // shortReserveLiquidityAta,
      new PublicKey(shortReserve.pubkey),
      new PublicKey(lendingMarket.pubkey),
      lendingProgramId
    )
  );

  tx.add(
    Token.createCloseAccountInstruction(
      TOKEN_PROGRAM_ID,
      wsolTokenAccountExtra,
      // shortReserveLiquidityAta,
      obligation.info.owner,
      obligation.info.owner,
      []
    )
  );

  const { associatedMSolTokenAccountAddress, transaction: transactionmsol } =
    await marinade.deposit(flashLoanAmount);

  for (let i = 0; i < transactionmsol.instructions.length; i++) {
    tx.add(transactionmsol.instructions[i]);
    // console.log(transactionmsol.instructions[i].programId.toBase58());
    // console.log(
    //   transactionmsol.instructions[i].keys.map((x) => x.pubkey.toBase58())
    // );
  }

  const [lendingMarketAuthority, _] = findProgramAddressSync(
    [new PublicKey(lendingMarket.pubkey).toBytes()],
    lendingProgramId
  );

  tx.add(
    depositReserveLiquidityAndObligationCollateralInstruction(
      msolDepositAmount,
      longReserveLiquidityAta,
      longReserveCollateralAta,
      longReserve.pubkey,
      longReserve.info.liquidity.supplyPubkey,
      longReserve.info.collateral.mintPubkey,
      lendingMarket.pubkey,
      lendingMarketAuthority,
      longReserve.info.collateral.supplyPubkey,
      obligation.pubkey,
      payer,
      NULL_PUBKEY,
      longReserveSwitchboard,
      payer,
      lendingProgramId
    )
  );
  tx.add(
    refreshReserveInstruction(
      new PublicKey(longReserve.pubkey),
      lendingProgramId,
      longReservePyth,
      longReserveSwitchboard
    )
  );
  tx.add(
    refreshReserveInstruction(
      new PublicKey(shortReserve.pubkey),
      lendingProgramId,
      shortReservePyth,
      shortReserveSwitchboard
    )
  );

  tx.add(
    refreshObligationInstruction(
      obligation.pubkey,
      obligation.info.deposits.map((ol) => ol.depositReserve),
      obligation.info.borrows.map((ol) => ol.borrowReserve),
      lendingProgramId
    )
  );

  tx.add(
    borrowObligationLiquidityInstruction(
      flashLoanAmount,
      shortReserve.info.liquidity.supplyPubkey,
      shortReserveLiquidityAta,
      shortReserve.pubkey,
      shortReserve.info.config.feeReceiver ?? NULL_PUBKEY,
      obligation.pubkey,
      lendingMarket.pubkey,
      lendingMarketAuthority,
      payer,
      lendingProgramId
    )
  );

  tx.add(
    flashRepayReserveLiquidityInstruction(
      flashLoanAmount,
      0,
      shortReserveLiquidityAta,
      shortReserve.info.liquidity.supplyPubkey,
      shortReserve.info.config.feeReceiver ?? NULL_PUBKEY,
      shortReserve.info.config.feeReceiver ?? NULL_PUBKEY,
      shortReserve.pubkey,
      lendingMarket.pubkey,
      payer,
      lendingProgramId
    )
  );

  return tx;
};

const delever = async (
  lendingProgramId: PublicKey,
  lendingMarket: LendingMarket,
  suppliedReserve: Reserve,
  suppliedReservePyth: PublicKey,
  suppliedReserveSwitchboard: PublicKey,
  borrowedReserve: Reserve,
  borrowedReservePyth: PublicKey,
  borrowedReserveSwitchboard: PublicKey,
  obligation: Obligation,
  jupiter: Jupiter
): Promise<Transaction> => {
  if (
    suppliedReserve == null ||
    borrowedReserve == null ||
    obligation == null
  ) {
    throw "1";
  }

  // Assumptions:
  // 1. Obligation has 1 deposit reserve, 1 borrow reserve
  if (obligation.info.deposits.length != 1) {
    throw "There are zero deposits";
  }

  if (obligation.info.borrows.length != 1) {
    throw "There are zero borrows";
  }

  const borrowedReserveLiquidityAta = await getATA(
    borrowedReserve.info.liquidity.mintPubkey,
    obligation.info.owner
  );

  const supplyReserveCtokenAta = await getATA(
    suppliedReserve.info.collateral.mintPubkey,
    obligation.info.owner
  );

  const supplyReserveLiquidityAta = await getATA(
    suppliedReserve.info.liquidity.mintPubkey,
    obligation.info.owner
  );

  // High level:
  // 1. flash borrow enough to cover borrowedReserve debt
  // 2. repay obligation
  // 3. withdraw everything from obligation (suppliedReserve.mint)
  // 4. swap longReserve assets to short reserve (this may even be optional, idk)
  // 5. flash repay debt
  let tx = new Transaction();

  const flashBorrowAmount = obligation.info.borrows[0].borrowedAmountWads
    .div(new BN(10).pow(new BN(18)))
    .add(new BN(1)) // couldn't find a ceiling fn
    .toNumber();

  tx.add(
    flashBorrowReserveLiquidityInstruction(
      flashBorrowAmount,
      borrowedReserve.info.liquidity.supplyPubkey,
      borrowedReserveLiquidityAta,
      borrowedReserve.pubkey,
      lendingMarket.pubkey,
      lendingProgramId
    )
  );
  tx.add(
    repayObligationLiquidityInstruction(
      U64_MAX,
      borrowedReserveLiquidityAta,
      borrowedReserve.info.liquidity.supplyPubkey,
      borrowedReserve.pubkey,
      obligation.pubkey,
      lendingMarket.pubkey,
      obligation.info.owner,
      lendingProgramId
    )
  );

  const [lendingMarketAuthority, _] = findProgramAddressSync(
    [new PublicKey(lendingMarket.pubkey).toBytes()],
    lendingProgramId
  );

  tx.add(
    refreshReserveInstruction(
      suppliedReserve.pubkey,
      lendingProgramId,
      suppliedReservePyth,
      suppliedReserveSwitchboard
    )
  );

  tx.add(
    refreshObligationInstruction(
      obligation.pubkey,
      [suppliedReserve.pubkey],
      [],
      lendingProgramId
    )
  );

  tx.add(
    withdrawObligationCollateralAndRedeemReserveLiquidity(
      U64_MAX,
      suppliedReserve.info.collateral.supplyPubkey,
      supplyReserveCtokenAta,
      suppliedReserve.pubkey,
      obligation.pubkey,
      lendingMarket.pubkey,
      lendingMarketAuthority,
      supplyReserveLiquidityAta,
      suppliedReserve.info.collateral.mintPubkey,
      suppliedReserve.info.liquidity.supplyPubkey,
      obligation.info.owner,
      obligation.info.owner,
      lendingProgramId
    )
  );

  // approximate ctoken => liquidity conversion lmao.
  const swapAmount = Math.ceil(
    obligation.info.deposits[0].depositedAmount.toNumber()
  );

  {
    const routes = await jupiter.computeRoutes({
      inputMint: new PublicKey(suppliedReserve.info.liquidity.mintPubkey),
      outputMint: new PublicKey(borrowedReserve.info.liquidity.mintPubkey),
      amount: JSBI.BigInt(swapAmount),
      slippage: 1, // 1 = 1%
      onlyDirectRoutes: true,
      forceFetch: true,
    });

    const route = routes.routesInfos.find(
      (route) => route.marketInfos[0].amm.label == AMM
    );
    if (route == null) {
      throw "undefined route info";
    }
    const { transactions } = await jupiter.exchange({
      routeInfo: route,
    });

    // FIXME: handle setupTransaction
    const { setupTransaction, swapTransaction, cleanupTransaction } =
      transactions;
    for (let i = 0; i < swapTransaction.instructions.length; i++) {
      tx.add(swapTransaction.instructions[i]);
    }
  }

  tx.add(
    flashRepayReserveLiquidityInstruction(
      flashBorrowAmount,
      0,
      borrowedReserveLiquidityAta,
      borrowedReserve.info.liquidity.supplyPubkey,
      borrowedReserve.info.config.feeReceiver ?? NULL_PUBKEY,
      borrowedReserve.info.config.feeReceiver ?? NULL_PUBKEY,
      borrowedReserve.pubkey,
      lendingMarket.pubkey,
      obligation.info.owner,
      lendingProgramId
    )
  );

  return tx;
};

const main = async () => {
  const action = process.argv[2];

  const payer = USER_KEYPAIR;

  const lendingMarketKey = new PublicKey(
    "HB1cecsgnFPBfKxEDfarVtKXEARWuViJKCqztWiFB3Uk"
  );
  const lendingMarketAccount = await connection.getAccountInfo(
    lendingMarketKey
  );
  if (lendingMarketAccount == null) {
    return;
  }

  const lendingMarket = parseLendingMarket(
    lendingMarketKey,
    lendingMarketAccount
  );

  const usdcReserveKey = new PublicKey(
    "AtSBZ8CRwAAkxtvtqdaxQ8YBpebwCio7epjrE2qFHru9"
  );
  const usdcReserveAccount = await connection.getAccountInfo(usdcReserveKey);
  if (usdcReserveAccount == null) {
    return;
  }
  const usdcReserve = parseReserve(usdcReserveKey, usdcReserveAccount);

  const solReserveKey = new PublicKey(
    "h346nBr4UmAss3LjbFGBugjJHNcegQFw9ih6g9woNme"
  );
  const solReserveAccount = await connection.getAccountInfo(solReserveKey);
  if (solReserveAccount == null) {
    return;
  }
  const solReserve = parseReserve(solReserveKey, solReserveAccount);

  const msolReserveKey = new PublicKey(
    "E7SMTfMiy7gLcpEv7JD9XGDwipaNC4agzGYRp48ZFRpZ"
  );
  const msolReserveAccount = await connection.getAccountInfo(msolReserveKey);
  if (msolReserveAccount == null) {
    return;
  }
  const msolReserve = parseReserve(msolReserveKey, msolReserveAccount);

  // preLever
  const { preLeverTx, obligationAddress, wsolTokenAccountExtra, extraKeyPair } =
    await preLever(
      payer.publicKey,
      lendingMarketKey,
      SOLEND_BETA_PROGRAM_ID,
      "msol-sol"
    );

  if (action == "view") {
    const obligationAddress = new PublicKey(process.argv[3]);
    const obligationAccount = await connection.getAccountInfo(
      obligationAddress
    );

    if (obligationAccount == null) {
      return;
    }
    const obligation = parseObligation(obligationAddress, obligationAccount);
    console.log(obligationToString(obligation!.info));
    return;
  }
  // lever
  if (action == "lever") {
    if (preLeverTx.instructions.length > 0) {
      console.log("prelever");
      const sig = await connection.sendTransaction(preLeverTx, [
        payer,
        extraKeyPair,
      ]);
      await connection.confirmTransaction(sig);
      console.log(sig);
    } else {
      console.log("skipping prelever");
    }

    console.log("levering!");

    const obligationAccount = await connection.getAccountInfo(
      obligationAddress
    );
    if (obligationAccount == null) {
      return;
    }
    const obligation = parseObligation(obligationAddress, obligationAccount);
    const leverTx = await lever(
      SOLEND_BETA_PROGRAM_ID,
      lendingMarket,
      msolReserve,
      NULL_PUBKEY,
      new PublicKey("CEPVH2t11KS4CaL3w4YxT9tRiijoGA4VEbnQ97cEpDmQ"),
      // usdcReserve,
      solReserve,
      NULL_PUBKEY,
      new PublicKey("AdtRGGhmqvom3Jemp5YNrxd9q9unX36BZk1pujkkXijL"),
      obligation,
      1e6,
      wsolTokenAccountExtra
    );

    console.log("Sending!");
    const sig = await connection.sendTransaction(leverTx, [payer], {
      skipPreflight: false,
    });
    await connection.confirmTransaction(sig);
    console.log(sig);
  }

  // de-lever
  // if (action == "delever") {
  //   console.log("delevering!");

  //   const obligationAccount = await connection.getAccountInfo(OBLIGATION);
  //   if (obligationAccount == null) {
  //     return;
  //   }
  //   const obligation = parseObligation(OBLIGATION, obligationAccount);
  //   const deleverTx = await delever(
  //     SOLEND_BETA_PROGRAM_ID,
  //     lendingMarket,
  //     msolReserve,
  //     NULL_PUBKEY,
  //     new PublicKey("CEPVH2t11KS4CaL3w4YxT9tRiijoGA4VEbnQ97cEpDmQ"),
  //     usdcReserve,
  //     NULL_PUBKEY,
  //     new PublicKey("CZx29wKMUxaJDq6aLVQTdViPL754tTR64NAgQBUGxxHb"),
  //     obligation,
  //   );

  //   const sig = await connection.sendTransaction(deleverTx, [payer]);
  //   console.log(sig);
  // }

  return;
};

main();
