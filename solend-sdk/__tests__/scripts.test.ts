import {
    ComputeBudgetProgram,
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    TransactionMessage,
    VersionedTransaction,
  } from "@solana/web3.js";
  import { fetchPoolByAddress, fetchPools, parseObligation, SolendActionCore, toHexString } from "../src";
  import { PriceServiceConnection } from "@pythnetwork/price-service-client";
  import { PythSolanaReceiver, pythSolanaReceiverIdl } from "@pythnetwork/pyth-solana-receiver";
  import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
  import { AnchorProvider, Program } from "@coral-xyz/anchor-30";
  import { CrossbarClient, loadLookupTables, PullFeed, SB_ON_DEMAND_PID } from "@switchboard-xyz/on-demand";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotent,
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID
} from "@solana/spl-token";
import { createDepositAndMintWrapperTokensInstruction } from '@solendprotocol/token2022-wrapper-sdk';
import SwitchboardProgram from "@switchboard-xyz/sbv2-lite";
import { Wallet } from "@coral-xyz/anchor";
  
  jest.setTimeout(50_000);
  
  const connection = new Connection("https://solendf-solendf-67c7.rpcpool.com/6096fc4b-78fc-4130-a42a-e6d4b9c37813");
  const testKey = [103,129,37,223,47,99,63,95,41,95,190,254,216,11,20,217,101,217,65,173,210,207,137,44,176,136,93,84,15,87,212,78,254,157,169,160,244,214,188,162,227,202,121,33,107,191,169,212,16,93,176,86,248,238,250,64,147,23,50,212,180,223,6,63];
  
  describe("runs script", function () {
    it("pulls switchboard oracle", async function () {
    if (testKey.length === 0) {
        throw Error('Best tested with a throwaway mainnet test account.')
    }
  
      const provider = new AnchorProvider(connection, new NodeWallet(Keypair.fromSecretKey(new Uint8Array(
        testKey
      ))), {});

      const keypair = Keypair.fromSecretKey(new Uint8Array(
        testKey
      ));

      const ata2022 = await createAssociatedTokenAccountIdempotent(
        connection,
        keypair,
        new PublicKey('2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo'),
        keypair.publicKey,
        {},
        TOKEN_2022_PROGRAM_ID
      );
    

      console.log(ata2022.toBase58());

      const ix = await createDepositAndMintWrapperTokensInstruction(
        provider.publicKey,
        ata2022,
        new PublicKey('2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo'),
        1000,
      );
      // Get the latest context
      const {
        value: { blockhash },
      } = await connection.getLatestBlockhashAndContext();

      // Get Transaction Message 
      const message = new TransactionMessage({
        payerKey: provider.publicKey,
        recentBlockhash: blockhash,
        instructions: [ix],
      }).compileToV0Message();
      
      // Get Versioned Transaction
      const vtx = new VersionedTransaction(message);
      provider.wallet.signAllTransactions([vtx]);
      const sig = await connection.sendRawTransaction(vtx.serialize(), {skipPreflight: true});
      console.log(sig);
      await connection.confirmTransaction(sig, 'confirmed');  
    });


    it("deposits token2022", async function () {
      if (testKey.length === 0) {
          throw Error('Best tested with a throwaway mainnet test account.')
      }
    
        const provider = new AnchorProvider(connection, new NodeWallet(Keypair.fromSecretKey(new Uint8Array(
          testKey
        ))), {});

        const sb = await SwitchboardProgram.loadMainnet(connection);
        const currentSlot = await provider.connection.getSlot();
        const pool = await fetchPools(
          [{
            name: 'main',
            address: 'HB1cecsgnFPBfKxEDfarVtKXEARWuViJKCqztWiFB3Uk',
            authorityAddress: 'G9Ed4rdvrBypMPAz2QH6Pi9VZADkLuvo9sPvbTvHmVTU',
            reserves: [],
            owner: 'BownY7uPxZ5jLjBxPNvqaWa3VD9WJvwQEUYVC5sERzET',
          }],
          connection,
          sb,
          'BLendhFh4HGnycEDDFhbeFEUYLP4fXB5tTHMoTX8Dch5',
          currentSlot
        );
  
        console.log(pool);
        console.log(pool['HB1cecsgnFPBfKxEDfarVtKXEARWuViJKCqztWiFB3Uk'].reserves.find(r => r.address === 'CejQKkwbVmrzW2DYLL2N9ySD8uey44xx4PoSZ17bQJT3')!)
        const action = SolendActionCore.buildDepositTxns(
          pool['HB1cecsgnFPBfKxEDfarVtKXEARWuViJKCqztWiFB3Uk'],
          pool['HB1cecsgnFPBfKxEDfarVtKXEARWuViJKCqztWiFB3Uk'].reserves.find(r => r.address === 'CejQKkwbVmrzW2DYLL2N9ySD8uey44xx4PoSZ17bQJT3')!,
          connection,
          '100',
          provider.wallet as Wallet,
          'beta',
          undefined,
          undefined,
          undefined,
          '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo'
        );

        const blockhash = await provider.connection.getLatestBlockhashAndContext();
  
        const txns = await (await action).getTransactions(blockhash.value)

        console.log(txns);
        const txnsArray = [
          txns.preLendingTxn,
          txns.lendingTxn,
          txns.postLendingTxn
        ].filter(Boolean) as VersionedTransaction[]
        // Get Versioned Transaction
        provider.wallet.signAllTransactions(txnsArray);
        for (const tx of txnsArray) {
          const sig = await connection.sendRawTransaction(tx.serialize(), {skipPreflight: true});
          console.log(sig);
          await connection.confirmTransaction(sig, 'confirmed');  
        }
      });

      it("withdraws token2022", async function () {
        if (testKey.length === 0) {
            throw Error('Best tested with a throwaway mainnet test account.')
        }
      
          const provider = new AnchorProvider(connection, new NodeWallet(Keypair.fromSecretKey(new Uint8Array(
            testKey
          ))), {});
  
          const sb = await SwitchboardProgram.loadMainnet(connection);
          const currentSlot = await provider.connection.getSlot();
          const pool = await fetchPools(
            [{
              name: 'main',
              address: 'HB1cecsgnFPBfKxEDfarVtKXEARWuViJKCqztWiFB3Uk',
              authorityAddress: 'G9Ed4rdvrBypMPAz2QH6Pi9VZADkLuvo9sPvbTvHmVTU',
              reserves: [],
              owner: 'BownY7uPxZ5jLjBxPNvqaWa3VD9WJvwQEUYVC5sERzET',
            }],
            connection,
            sb,
            'BLendhFh4HGnycEDDFhbeFEUYLP4fXB5tTHMoTX8Dch5',
            currentSlot
          );
    
          console.log(pool);
          console.log(pool['HB1cecsgnFPBfKxEDfarVtKXEARWuViJKCqztWiFB3Uk'].reserves.find(r => r.address === 'CejQKkwbVmrzW2DYLL2N9ySD8uey44xx4PoSZ17bQJT3')!)
          const action = SolendActionCore.buildWithdrawTxns(
            pool['HB1cecsgnFPBfKxEDfarVtKXEARWuViJKCqztWiFB3Uk'],
            pool['HB1cecsgnFPBfKxEDfarVtKXEARWuViJKCqztWiFB3Uk'].reserves.find(r => r.address === 'CejQKkwbVmrzW2DYLL2N9ySD8uey44xx4PoSZ17bQJT3')!,
            connection,
            '100',
            provider.wallet as Wallet,
            'beta',
            undefined,
            undefined,
            undefined,
            undefined,
            '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo'
          );
  
          const blockhash = await provider.connection.getLatestBlockhashAndContext();
    
          const txns = await (await action).getTransactions(blockhash.value)
  
          console.log(txns);
          const txnsArray = [
            txns.preLendingTxn,
            txns.lendingTxn,
            txns.postLendingTxn
          ].filter(Boolean) as VersionedTransaction[]
          // Get Versioned Transaction
          provider.wallet.signAllTransactions(txnsArray);
          for (const tx of txnsArray) {
            const sig = await connection.sendRawTransaction(tx.serialize(), {skipPreflight: true});
            console.log(sig);
            await connection.confirmTransaction(sig, 'confirmed');  
          }
        });
  });
  