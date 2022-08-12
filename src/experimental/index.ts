/* eslint-disable no-unused-vars */
import JSBI from "jsbi";
import {
  Connection,
  Keypair,
  Transaction,
  PublicKey,
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
} from "../../dist";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Jupiter, SwapMode, TOKEN_LIST_URL } from "@jup-ag/core";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import Decimal from "decimal.js";
import BN from "bn.js";

const NULL_PUBKEY = new PublicKey(
  "nu11111111111111111111111111111111111111111"
);

const SOLANA_RPC_ENDPOINT = "https://solend.rpcpool.com/a3e03ba77d5e870c8c694b19d61c"
const OBLIGATION = new PublicKey(
  "HQNn9kb7QyCuu2QxuE6yd8cJRebpBq824cu1gM6gRRVb"
);

const WALLET_PRIVATE_KEY: number[] = JSON.parse(
  process.env.WALLET_PRIVATE_KEY || "[]"
);
export const USER_KEYPAIR = Keypair.fromSecretKey(
  Uint8Array.from(WALLET_PRIVATE_KEY)
);

const U64_MAX = new BN("18446744073709551615"); // jank life

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

const AMM = "Serum";

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
  jupiter: Jupiter,
  flashLoanAmount: number, // quantity of tokens to flash bhorrow
  inputAmount: number // quantity of tokens already available in obligation owner's wallet
) => {
  if (longReserve == null || shortReserve == null || obligation == null) {
    throw "1";
  }

  const payer = obligation.info.owner;

  // invariant: user will get market value of (flashLoanAmount + inputAmount) tokens in the longReserve mint type.
  const routes = await jupiter.computeRoutes({
    inputMint: new PublicKey(shortReserve.info.liquidity.mintPubkey),
    outputMint: new PublicKey(longReserve.info.liquidity.mintPubkey),
    amount: JSBI.BigInt(flashLoanAmount + inputAmount), // 1000000 => 1 USDC if inputToken.address is USDC mint
    slippage: 1, // 1 = 1%
    onlyDirectRoutes: true,
    forceFetch: true,
  });
  routes.routesInfos.forEach((route) => console.log(route.marketInfos[0].amm.label));

  const route = routes.routesInfos.find((route) => route.marketInfos[0].amm.label == AMM);
  if (route == null) {
    throw 'undefined route info';
  }

  const { transactions } = await jupiter.exchange({
    routeInfo: route,
  });

  // FIXME: handle setupTransactions (eg creating ATAs)
  const { setupTransaction, swapTransaction, cleanupTransaction } =
    transactions;

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
      shortReserveLiquidityAta,
      new PublicKey(shortReserve.pubkey),
      new PublicKey(lendingMarket.pubkey),
      lendingProgramId
    )
  );

  for (let i = 0; i < swapTransaction.instructions.length; i++) {
    tx.add(swapTransaction.instructions[i]);
  }

  const [lendingMarketAuthority, _] = findProgramAddressSync(
    [new PublicKey(lendingMarket.pubkey).toBytes()],
    lendingProgramId
  );

  tx.add(
    depositReserveLiquidityAndObligationCollateralInstruction(
      // FIXME: sometimes jupiter doesn't return the amount it says it will :(
      Math.ceil(JSBI.toNumber(routes.routesInfos[0].outAmount) * 0.99),
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
      OBLIGATION,
      [new PublicKey(longReserve.pubkey)],
      [],
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

  console.log("hello");
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

    const route = routes.routesInfos.find((route) => route.marketInfos[0].amm.label == AMM);
    if (route == null) {
      throw 'undefined route info';
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
  const connection = new Connection(SOLANA_RPC_ENDPOINT);

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

  const msolReserveKey = new PublicKey(
    "E7SMTfMiy7gLcpEv7JD9XGDwipaNC4agzGYRp48ZFRpZ"
  );
  const msolReserveAccount = await connection.getAccountInfo(msolReserveKey);
  if (msolReserveAccount == null) {
    return;
  }
  const msolReserve = parseReserve(msolReserveKey, msolReserveAccount);

  const jupiter = await Jupiter.load({
    connection,
    cluster: "mainnet-beta",
    user: USER_KEYPAIR, // or public key
  });

  // lever
  if (action == "lever") {
    console.log("levering!");

    const obligationAccount = await connection.getAccountInfo(OBLIGATION);
    if (obligationAccount == null) {
      return;
    }
    const obligation = parseObligation(OBLIGATION, obligationAccount);
    const leverTx = await lever(
      SOLEND_BETA_PROGRAM_ID,
      lendingMarket,
      msolReserve,
      NULL_PUBKEY,
      new PublicKey("CEPVH2t11KS4CaL3w4YxT9tRiijoGA4VEbnQ97cEpDmQ"),
      usdcReserve,
      NULL_PUBKEY,
      new PublicKey("CZx29wKMUxaJDq6aLVQTdViPL754tTR64NAgQBUGxxHb"),
      obligation,
      jupiter,
      1e6,
      1e6
    );

    console.log("Sending!");
    const sig = await connection.sendTransaction(leverTx, [payer]);
    console.log(sig);
  }

  // de-lever
  if (action == "delever") {
    console.log("delevering!");

    const obligationAccount = await connection.getAccountInfo(OBLIGATION);
    if (obligationAccount == null) {
      return;
    }
    const obligation = parseObligation(OBLIGATION, obligationAccount);
    const deleverTx = await delever(
      SOLEND_BETA_PROGRAM_ID,
      lendingMarket,
      msolReserve,
      NULL_PUBKEY,
      new PublicKey("CEPVH2t11KS4CaL3w4YxT9tRiijoGA4VEbnQ97cEpDmQ"),
      usdcReserve,
      NULL_PUBKEY,
      new PublicKey("CZx29wKMUxaJDq6aLVQTdViPL754tTR64NAgQBUGxxHb"),
      obligation,
      jupiter
    );

    const sig = await connection.sendTransaction(deleverTx, [payer]);
    console.log(sig);
  }

  return;
};

main();
