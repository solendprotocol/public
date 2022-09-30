import { Connection, Keypair, Transaction, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import * as anchor from '@project-serum/anchor';
import { SolendAction, SolendMarket, SolendWallet } from "../src";

jest.setTimeout(50_000);

describe("calculate", function () {
  it("reads wallet", async function () {
    const connection = new Connection('https://api.mainnet-beta.solana.com', {
      commitment: "finalized",
    });

      const keypair = Keypair.generate();
      const wallet = new anchor.Wallet(keypair);
      const solendWallet = await SolendWallet.initialize(
        wallet,
        connection,
      );

    const [setupIxs, claimIxs] = await solendWallet.getClaimAllIxs();

    expect([...setupIxs, ...claimIxs].length).toEqual(0);
  });

  it("reads solend main market", async function () {
    const connection = new Connection('https://api.mainnet-beta.solana.com', {
      commitment: "finalized",
    });

      const market = await SolendMarket.initialize(
        connection
      );
      await market.loadReserves();
      await market.loadRewards();
      const reserve = market.reserves.find(res => res.config.liquidityToken.symbol === 'USDC');

      expect(reserve!.stats!.decimals).toEqual(6);
      expect(reserve!.stats!.protocolTakeRate).toBeLessThanOrEqual(1);
  });

  it("reads solend devnet", async function () {
    const connection = new Connection('https://api.devnet.solana.com', {
      commitment: "finalized",
    });

      const market = await SolendMarket.initialize(
        connection,
        'devnet'
      );
      await market.loadReserves();
      await market.loadRewards();
      const reserve = market.reserves.find(res => res.config.liquidityToken.symbol === 'USDC');

      expect(reserve!.stats!.decimals).toEqual(6);
      expect(reserve!.stats!.protocolTakeRate).toBeLessThanOrEqual(1);
  });

  it("reads solend invictus market", async function () {
    const connection = new Connection('https://api.mainnet-beta.solana.com', {
      commitment: "finalized",
    });

    const market = await SolendMarket.initialize(
      connection,
      'production',
      '5i8SzwX2LjpGUxLZRJ8EiYohpuKgW2FYDFhVjhGj66P1',
    );
    await market.loadReserves();
    await market.loadRewards();
    const reserve = market.reserves.find(res => res.config.liquidityToken.symbol === 'USDC');
    expect((await reserve!.totalBorrowAPY()).rewards).toEqual([]);
    expect(reserve!.stats!.optimalUtilizationRate).toEqual(0.8);
  });

  it("reads permissionless", async function () {
    const connection = new Connection('https://api.mainnet-beta.solana.com', {
      commitment: "finalized",
    });

    const market = await SolendMarket.initialize(
      connection,
      'production',
      'Ckya2fwCXDqTUg9fnWbajR6YLcSfQmPxxy5MyAoZXgyb',
    );
    await market.loadReserves();
    await market.loadRewards();
    const reserve = market.reserves.find(res => res.config.liquidityToken.symbol === 'SLND');
    expect((await reserve!.totalBorrowAPY()).rewards).toEqual([]);
    expect(reserve!.stats!.optimalUtilizationRate).toEqual(0.8);
  });

  it("performs a deposit", async function () {
    const connection = new Connection('https://api.devnet.solana.com', {
      commitment: "finalized",
    });

    const depositAmount = new BN("1000");

    const account = Keypair.generate();

    const signature = await connection.requestAirdrop(account.publicKey, LAMPORTS_PER_SOL);
    await connection.confirmTransaction(signature);

    const solendAction = await SolendAction.buildDepositTxns(
      connection,
      depositAmount,
      "SOL",
      account.publicKey,
      "devnet"
    );

    const sendTransaction = async (txn: Transaction, connection: Connection) => {
      const { blockhash } = await connection.getRecentBlockhash();
      txn.recentBlockhash = blockhash;
      txn.feePayer = account.publicKey;
      txn.sign(account);
      return connection.sendRawTransaction(txn.serialize());
    }

    const txHash = await solendAction.sendTransactions(sendTransaction);

    await connection.confirmTransaction(txHash, 'finalized');

    const market = await SolendMarket.initialize(
      connection,
      'devnet',
    );

    const obligation = await market.fetchObligationByWallet(account.publicKey);

    expect(obligation!.deposits[0].amount === depositAmount)
  });

  // TODO update to a non-primary pool after another pool deployed to devnet
  it("performs a deposit to specific pool", async function () {
    const connection = new Connection('https://api.devnet.solana.com', {
      commitment: "finalized",
    });

    const depositAmount = new BN("1000");

    const account = Keypair.generate();

    const signature = await connection.requestAirdrop(account.publicKey, LAMPORTS_PER_SOL);
    await connection.confirmTransaction(signature);

    const solendAction = await SolendAction.buildDepositTxns(
      connection,
      depositAmount,
      "SOL",
      account.publicKey,
      "devnet",
      new PublicKey("GvjoVKNjBvQcFaSKUW1gTE7DxhSpjHbE69umVR5nPuQp"),
    );

    const sendTransaction = async (txn: Transaction, connection: Connection) => {
      const { blockhash } = await connection.getRecentBlockhash();
      txn.recentBlockhash = blockhash;
      txn.feePayer = account.publicKey;
      txn.sign(account);
      return connection.sendRawTransaction(txn.serialize());
    }

    const txHash = await solendAction.sendTransactions(sendTransaction);

    await connection.confirmTransaction(txHash, 'finalized');

    const market = await SolendMarket.initialize(
      connection,
      'devnet',
    );

    const obligation = await market.fetchObligationByWallet(account.publicKey);

    expect(obligation!.deposits[0].amount === depositAmount)
  });
});
