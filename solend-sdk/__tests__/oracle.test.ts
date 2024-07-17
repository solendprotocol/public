import {
    ComputeBudgetProgram,
    Connection,
    Keypair,
    PublicKey,
    TransactionMessage,
    VersionedTransaction,
  } from "@solana/web3.js";
  import { parseObligation } from "../src";
  import { PriceServiceConnection } from "@pythnetwork/price-service-client";
  import { PythSolanaReceiver, pythSolanaReceiverIdl } from "@pythnetwork/pyth-solana-receiver";
  import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
  import { AnchorProvider, Program } from "@coral-xyz/anchor-30";
  import { CrossbarClient, loadLookupTables, PullFeed, SB_ON_DEMAND_PID } from "@switchboard-xyz/on-demand";
  
  jest.setTimeout(50_000);
  
  describe("check", function () {
    it("pulls switchboard oracle", async function () {
      const connection = new Connection("https://api.mainnet-beta.solana.com");
    const testKey = []
    if (testKey.length === 0) {
        throw Error('Best tested with a throwaway mainnet test account.')
    }
  
      const provider = new AnchorProvider(connection, new NodeWallet(Keypair.fromSecretKey(new Uint8Array(
        testKey
      ))), {});
      const idl = (await Program.fetchIdl(SB_ON_DEMAND_PID, provider))!;
      const sbod = new Program(idl, provider);
  
      const sbPulledOracles = [
        '2F9M59yYc28WMrAymNWceaBEk8ZmDAjUAKULp8seAJF3',
        'AZcoqpWhMJUaKEDUfKsfzCr3Y96gSQwv43KSQ6KpeyQ1'
      ];

      const feedAccounts = sbPulledOracles.map((oracleKey) => new PullFeed(sbod as any, oracleKey));
        const crossbar = new CrossbarClient("https://crossbar.switchboard.xyz");
  
      // Responses is Array<[pullIx, responses, success]>
      const responses =  await Promise.all(feedAccounts.map((feedAccount) => feedAccount.fetchUpdateIx({ numSignatures: 1, crossbarClient: crossbar })));
      const oracles = responses.flatMap((x) => x[1].map(y => y.oracle));
      const lookupTables = await loadLookupTables([...oracles, ...feedAccounts]);
  
      // Get the latest context
      const {
        value: { blockhash },
      } = await connection.getLatestBlockhashAndContext();
    
      // Get Transaction Message 
      const message = new TransactionMessage({
        payerKey: provider.publicKey,
        recentBlockhash: blockhash,
        instructions: [...responses.map(r => r[0]!)],
      }).compileToV0Message(lookupTables);
      
      // Get Versioned Transaction
      const vtx = new VersionedTransaction(message);
      provider.wallet.signAllTransactions([vtx]);
      const sig = await connection.sendRawTransaction(vtx.serialize(), {skipPreflight: true});
      await connection.confirmTransaction(sig, 'confirmed');  
    });
  
    it("pulls pyth oracles", async function () {
      const connection = new Connection("https://api.mainnet-beta.solana.com");
      const testKey = []
        if (testKey.length === 0) {
            throw Error('Best tested with a throwaway mainnet test account.')
        }
      const priceServiceConnection = new PriceServiceConnection("https://hermes.pyth.network");
      const pythSolanaReceiver = new PythSolanaReceiver({ 
        connection: connection,
        wallet: new NodeWallet(Keypair.fromSecretKey(new Uint8Array(
            testKey
        )))
      });
      const transactionBuilder = pythSolanaReceiver.newTransactionBuilder({
        closeUpdateAccounts: true,
      });
  
      let priceFeedUpdateData;
      priceFeedUpdateData = await priceServiceConnection.getLatestVaas(
        [
          '0x93c3def9b169f49eed14c9d73ed0e942c666cf0e1290657ec82038ebb792c2a8', // BLZE
          '0xf2fc1dfcf51867abfa70874c929e920edc649e4997cbac88f280094df8c72bcd', // EUROE
        ]
      );
  
      await transactionBuilder.addUpdatePriceFeed(
        priceFeedUpdateData,
        0 // shardId of 0
      );
  
      const transactionsWithSigners = await transactionBuilder.buildVersionedTransactions({
        tightComputeBudget: true,
      });
  
      const pullPriceTxns = [] as Array<VersionedTransaction>;

      for (const transaction of transactionsWithSigners) {
        const signers = transaction.signers;
        let tx = transaction.tx;
    
          if (signers) {
            tx.sign(signers);
            pullPriceTxns.push(tx);
          }
        } 
  
        pythSolanaReceiver.wallet.signAllTransactions(pullPriceTxns)
  
        for (const tx of pullPriceTxns) {
          const serializedTransaction = tx.serialize();
          const sig = await connection.sendRawTransaction(serializedTransaction, {skipPreflight: true});
          await connection.confirmTransaction(sig, 'confirmed');
        }
  
    });
  });
  