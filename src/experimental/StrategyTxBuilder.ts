import { Jupiter, WRAPPED_SOL_MINT } from "@jup-ag/core";
import {
  BN,
  Marinade,
  MarinadeConfig,
} from "@marinade.finance/marinade-ts-sdk";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import BigNumber from "bignumber.js";
import JSBI from "jsbi";
import {
  borrowObligationLiquidityInstruction,
  depositReserveLiquidityAndObligationCollateralInstruction,
  flashBorrowReserveLiquidityInstruction,
  flashRepayReserveLiquidityInstruction,
  initObligationInstruction,
  parseLendingMarket,
  parseObligation,
  parseReserve,
  refreshObligationInstruction,
  refreshReserveInstruction,
  repayObligationLiquidityInstruction,
  withdrawObligationCollateralAndRedeemReserveLiquidity,
} from "../../dist";

type LendingMarket = ReturnType<typeof parseLendingMarket>;
type Reserve = ReturnType<typeof parseReserve>;
type Obligation = ReturnType<typeof parseObligation>;
const U64_MAX = new BN("18446744073709551615"); // jank life

const NULL_PUBKEY = new PublicKey(
  "nu11111111111111111111111111111111111111111"
);
const AMM = "Orca";

export class MsolStrategyTxBuilder {
  connection: Connection;
  owner: PublicKey;
  msolReserve: Reserve;
  solReserve: Reserve;
  solendProgramId: PublicKey;
  lendingMarketKey: PublicKey;
  marinade: Marinade;

  // state that should be removed
  msolReservePyth: PublicKey;
  msolReserveSwitchboard: PublicKey;
  solReservePyth: PublicKey;
  solReserveSwitchboard: PublicKey;

  obligationKey: PublicKey;
  seed: string;

  static initialize = async (
    connection: Connection,
    owner: PublicKey,
    msolReserve: Reserve,
    solReserve: Reserve,
    solendProgramId: PublicKey,
    lendingMarketKey: PublicKey
  ) => {
    // FIXME use real seed instead of the default obligation
    const seed = `${lendingMarketKey.toString()}`.slice(0, 32);
    console.log(`Seed is ${seed}`);

    const obligationKey = await PublicKey.createWithSeed(
      owner,
      seed,
      solendProgramId
    );

    return new MsolStrategyTxBuilder(
      connection,
      owner,
      msolReserve,
      solReserve,
      solendProgramId,
      lendingMarketKey,
      obligationKey,
      seed
    );
  };

  private constructor(
    connection: Connection,
    owner: PublicKey,
    msolReserve: Reserve,
    solReserve: Reserve,
    solendProgramId: PublicKey,
    lendingMarketKey: PublicKey,
    obligationKey: PublicKey,
    seed: string
  ) {
    this.connection = connection;
    this.owner = owner;
    this.msolReserve = msolReserve;
    this.solReserve = solReserve;
    this.solendProgramId = solendProgramId;
    this.lendingMarketKey = lendingMarketKey;

    const config = new MarinadeConfig({
      connection,
      publicKey: this.owner,
      // referralCode: new PublicKey("SLN6aJmT5rP8cfeGnGNAQGJkyhA8oNQ2tP8AXX5TEcW"),
    });

    this.marinade = new Marinade(config);

    // hardcoded for now lol
    // FIXME use ReserveConfig when in web
    this.msolReservePyth = NULL_PUBKEY;
    this.msolReserveSwitchboard = new PublicKey(
      "CEPVH2t11KS4CaL3w4YxT9tRiijoGA4VEbnQ97cEpDmQ"
    );
    this.solReservePyth = NULL_PUBKEY;
    this.solReserveSwitchboard = new PublicKey(
      "AdtRGGhmqvom3Jemp5YNrxd9q9unX36BZk1pujkkXijL"
    );

    this.obligationKey = obligationKey;
    this.seed = seed;
  }

  private setupTx = async () => {
    const tx = new Transaction();
    if (!(await this.connection.getAccountInfo(this.obligationKey))) {
      tx.add(
        SystemProgram.createAccountWithSeed({
          fromPubkey: this.owner,
          newAccountPubkey: this.obligationKey,
          basePubkey: this.owner,
          seed: this.seed,
          lamports: await this.connection.getMinimumBalanceForRentExemption(
            1300
          ),
          space: 1300,
          programId: this.solendProgramId,
        })
      );
      tx.add(
        initObligationInstruction(
          this.obligationKey,
          new PublicKey(this.lendingMarketKey),
          this.owner,
          this.solendProgramId
        )
      );
    }

    const mints = [
      new PublicKey("So11111111111111111111111111111111111111112"),
      new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"),
      new PublicKey("J6SpsP89aKGQDJuJkJBKaGibC4sKyxYr7uxd7ucVhRtM"), // csol
      new PublicKey("C56frs7yfd6a6hGJhXuT7kYaU783LVk8ZGJNN728C47t"), // cmsol
    ];
    for (const mint of mints) {
      const tokenAccount = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        this.owner,
        true
      );

      if (!(await this.connection.getAccountInfo(tokenAccount))) {
        tx.add(
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            mint,
            tokenAccount,
            this.owner,
            this.owner
          )
        );
      }
    }

    // create extra wsol account. needed to send native sol to marinade. gets closed by the lever tx.
    // in case the lever tx fails, it's nice to use a deterministic key.
    const seed = `strat-extra-wsol-${this.lendingMarketKey.toString()}`.slice(
      0,
      32
    );
    const extraWSOLAccount = await PublicKey.createWithSeed(
      this.owner,
      seed,
      TOKEN_PROGRAM_ID
    );

    if (!(await this.connection.getAccountInfo(extraWSOLAccount))) {
      console.log("Creating extraWSOLAccount ", extraWSOLAccount.toString());
      tx.add(
        SystemProgram.createAccountWithSeed({
          fromPubkey: this.owner,
          newAccountPubkey: extraWSOLAccount,
          basePubkey: this.owner,
          seed: seed,
          lamports: await this.connection.getMinimumBalanceForRentExemption(
            165
          ),
          space: 165,
          programId: TOKEN_PROGRAM_ID,
        })
      );
      tx.add(
        Token.createInitAccountInstruction(
          TOKEN_PROGRAM_ID,
          WRAPPED_SOL_MINT,
          extraWSOLAccount,
          this.owner
        )
      );
    }

    return {
      tx: tx,
      obligationKey: this.obligationKey,
      extraWSOLAccount: extraWSOLAccount,
    };
  };

  // inputAmount: quantity of msol tokens in fractional units (eg 1e9 => 1 whole mSOL)
  calculateFlashLoanAndDepositAmount = (
    inputAmount: number,
    targetUtil: BigNumber,
    stakedSolToSolPrice: number
  ): [BN, BN] => {
    // calculate flash loan amount assuming target util of 80%
    // flashLoanAmount / (flashLoanAmount + inputAmount * msol-sol) = ltv
    // flashLoanAmount * ltv + inputAmount * msol-sol * ltv = flashLoanAmount
    // flashLoanAmount = inputAmount * msol-sol * ltv / (1 - ltv)
    // eg if we want 80% util with a 1 msol initial deposit:
    // => flashLoanAmount = 1 * 1.05 * 0.8 / (0.2) = 4.2SOL
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

  private leverTx = async (
    extraWSOLAccount: PublicKey,
    obligationKey: PublicKey,
    inputAmount: number // quantity of mSOL in user's wallet in fractional units (eg 1e9 => 1 "whole" msol)
  ) => {
    if (this.msolReserve == null || this.solReserve == null) {
      throw "1";
    }

    const msol_sol = (await this.marinade.getMarinadeState()).mSolPrice;
    const [flashLoanAmount, msolDepositAmount] =
      this.calculateFlashLoanAndDepositAmount(
        inputAmount,
        new BigNumber(0.75),
        msol_sol
      );

    const msolReserveLiquidityAta = await this.getATA(
      this.msolReserve.info.liquidity.mintPubkey,
      this.owner
    );
    const solReserveLiquidityAta = await this.getATA(
      this.solReserve.info.liquidity.mintPubkey,
      this.owner
    );

    const msolReserveCollateralAta = await this.getATA(
      this.msolReserve.info.collateral.mintPubkey,
      this.owner
    );

    const tx = new Transaction();
    tx.add(
      flashBorrowReserveLiquidityInstruction(
        flashLoanAmount,
        new PublicKey(this.solReserve.info.liquidity.supplyPubkey),
        extraWSOLAccount,
        // solReserveLiquidityAta,
        new PublicKey(this.solReserve.pubkey),
        new PublicKey(this.lendingMarketKey),
        this.solendProgramId
      )
    );

    tx.add(
      Token.createCloseAccountInstruction(
        TOKEN_PROGRAM_ID,
        extraWSOLAccount,
        // solReserveLiquidityAta,
        this.owner,
        this.owner,
        []
      )
    );

    const { associatedMSolTokenAccountAddress, transaction: transactionmsol } =
      await this.marinade.deposit(flashLoanAmount);

    for (let i = 0; i < transactionmsol.instructions.length; i++) {
      tx.add(transactionmsol.instructions[i]);
      // console.log(transactionmsol.instructions[i].programId.toBase58());
      // console.log(
      //   transactionmsol.instructions[i].keys.map((x) => x.pubkey.toBase58())
      // );
    }

    const [lendingMarketAuthority, _] = findProgramAddressSync(
      [new PublicKey(this.lendingMarketKey).toBytes()],
      this.solendProgramId
    );

    tx.add(
      depositReserveLiquidityAndObligationCollateralInstruction(
        msolDepositAmount,
        msolReserveLiquidityAta,
        msolReserveCollateralAta,
        this.msolReserve.pubkey,
        this.msolReserve.info.liquidity.supplyPubkey,
        this.msolReserve.info.collateral.mintPubkey,
        this.lendingMarketKey,
        lendingMarketAuthority,
        this.msolReserve.info.collateral.supplyPubkey,
        obligationKey,
        this.owner,
        NULL_PUBKEY,
        this.msolReserveSwitchboard,
        this.owner,
        this.solendProgramId
      )
    );
    tx.add(
      refreshReserveInstruction(
        new PublicKey(this.msolReserve.pubkey),
        this.solendProgramId,
        this.msolReservePyth,
        this.msolReserveSwitchboard
      )
    );
    tx.add(
      refreshReserveInstruction(
        new PublicKey(this.solReserve.pubkey),
        this.solendProgramId,
        this.solReservePyth,
        this.solReserveSwitchboard
      )
    );

    // either we're re-levering (case 1) or levering for the first time (case 2)
    // const depositKeys =
    //   obligation.info.deposits.length > 0
    //     ? obligation.info.deposits.map((ol) => ol.depositReserve)
    //     : [new PublicKey(this.msolReserve.pubkey)];
    const depositKeys = [new PublicKey(this.msolReserve.pubkey)];

    tx.add(
      refreshObligationInstruction(
        obligationKey,
        depositKeys,
        // obligation.info.borrows.map((ol) => ol.borrowReserve),
        [],
        this.solendProgramId
      )
    );

    tx.add(
      borrowObligationLiquidityInstruction(
        flashLoanAmount,
        this.solReserve.info.liquidity.supplyPubkey,
        solReserveLiquidityAta,
        this.solReserve.pubkey,
        this.solReserve.info.config.feeReceiver ?? NULL_PUBKEY,
        obligationKey,
        this.lendingMarketKey,
        lendingMarketAuthority,
        this.owner,
        this.solendProgramId
      )
    );

    tx.add(
      flashRepayReserveLiquidityInstruction(
        flashLoanAmount,
        0,
        solReserveLiquidityAta,
        this.solReserve.info.liquidity.supplyPubkey,
        this.solReserve.info.config.feeReceiver ?? NULL_PUBKEY,
        this.solReserve.info.config.feeReceiver ?? NULL_PUBKEY,
        this.solReserve.pubkey,
        this.lendingMarketKey,
        this.owner,
        this.solendProgramId
      )
    );

    return tx;
  };

  buildLeverTxs = async (startingMSolAmount: number) => {
    const { tx: setup, extraWSOLAccount, obligationKey } = await this.setupTx();

    return {
      setup: setup,
      lever: await this.leverTx(
        extraWSOLAccount,
        obligationKey,
        startingMSolAmount
      ),
    };
  };

  buildDeleverTx = async (
    obligation: Obligation,
    jupiter: Jupiter
  ): Promise<Transaction> => {
    // pass es-lint
    if (!obligation || this.msolReserve == null || this.solReserve == null) {
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

    const solReserveLiquidityAta = await this.getATA(
      this.solReserve.info.liquidity.mintPubkey,
      obligation.info.owner
    );

    const supplyReserveCtokenAta = await this.getATA(
      this.msolReserve.info.collateral.mintPubkey,
      obligation.info.owner
    );

    const supplyReserveLiquidityAta = await this.getATA(
      this.msolReserve.info.liquidity.mintPubkey,
      obligation.info.owner
    );

    // High level:
    // 1. flash borrow enough to cover solReserve debt
    // 2. repay obligation
    // 3. withdraw everything from obligation (this.msolReserve.mint)
    // 4. swap msolReserve assets to short reserve (this may even be optional, idk)
    // 5. flash repay debt
    let tx = new Transaction();

    const flashBorrowAmount = obligation.info.borrows[0].borrowedAmountWads
      .div(new BN(10).pow(new BN(18)))
      .add(new BN(1)); // couldn't find a ceiling fn

    console.log("attempting to flash borrow ", flashBorrowAmount.toString());

    tx.add(
      flashBorrowReserveLiquidityInstruction(
        flashBorrowAmount,
        this.solReserve.info.liquidity.supplyPubkey,
        solReserveLiquidityAta,
        this.solReserve.pubkey,
        this.lendingMarketKey,
        this.solendProgramId
      )
    );
    tx.add(
      repayObligationLiquidityInstruction(
        U64_MAX,
        solReserveLiquidityAta,
        this.solReserve.info.liquidity.supplyPubkey,
        this.solReserve.pubkey,
        obligation.pubkey,
        this.lendingMarketKey,
        obligation.info.owner,
        this.solendProgramId
      )
    );

    const [lendingMarketAuthority, _] = findProgramAddressSync(
      [new PublicKey(this.lendingMarketKey).toBytes()],
      this.solendProgramId
    );

    tx.add(
      refreshReserveInstruction(
        this.msolReserve.pubkey,
        this.solendProgramId,
        this.msolReservePyth,
        this.msolReserveSwitchboard
      )
    );

    tx.add(
      refreshObligationInstruction(
        obligation.pubkey,
        [this.msolReserve.pubkey],
        [],
        this.solendProgramId
      )
    );

    tx.add(
      withdrawObligationCollateralAndRedeemReserveLiquidity(
        U64_MAX,
        this.msolReserve.info.collateral.supplyPubkey,
        supplyReserveCtokenAta,
        this.msolReserve.pubkey,
        obligation.pubkey,
        this.lendingMarketKey,
        lendingMarketAuthority,
        supplyReserveLiquidityAta,
        this.msolReserve.info.collateral.mintPubkey,
        this.msolReserve.info.liquidity.supplyPubkey,
        obligation.info.owner,
        obligation.info.owner,
        this.solendProgramId
      )
    );

    const msol_sol = (await this.marinade.getMarinadeState()).mSolPrice;
    const swapAmount = Math.ceil(flashBorrowAmount.toNumber() / msol_sol);
    {
      const routes = await jupiter.computeRoutes({
        inputMint: new PublicKey(this.msolReserve.info.liquidity.mintPubkey),
        outputMint: new PublicKey(this.solReserve.info.liquidity.mintPubkey),
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

      // length - 1 bc jupiter to close wSOL token accounts :(
      for (let i = 0; i < swapTransaction.instructions.length - 1; i++) {
        tx.add(swapTransaction.instructions[i]);
      }
    }

    tx.add(
      flashRepayReserveLiquidityInstruction(
        flashBorrowAmount,
        0,
        solReserveLiquidityAta,
        this.solReserve.info.liquidity.supplyPubkey,
        this.solReserve.info.config.feeReceiver ?? NULL_PUBKEY,
        this.solReserve.info.config.feeReceiver ?? NULL_PUBKEY,
        this.solReserve.pubkey,
        this.lendingMarketKey,
        obligation.info.owner,
        this.solendProgramId
      )
    );

    return tx;
  };

  getATA = async (mintAddress: PublicKey, owner: PublicKey) => {
    return Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mintAddress,
      owner
    );
  };
}
