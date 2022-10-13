import { Connection, Keypair, Transaction, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { SolendAction, SolendMarket, SolendWallet } from "../src";
import * as anchor from '@project-serum/anchor';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { flashBorrowReserveLiquidityInstruction } from '../src/instructions/flashBorrowReserveLiquidity';
import { flashRepayReserveLiquidityInstruction } from '../src/instructions/flashRepayReserveLiquidity';
import {SOLEND_DEVNET_PROGRAM_ID} from '../src/classes/constants';

jest.setTimeout(120_000);

describe("flash loan", () => {
  it("empty flash loan", async () => {
      const connection = new Connection('https://api.devnet.solana.com', {
        commitment: "finalized",
      });
      const payer = Keypair.generate();
      { 
        const sig = await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL * 2);
        await connection.confirmTransaction(sig);
      }


      const market = await SolendMarket.initialize(
        connection,
        'devnet',
        "AAGH44cPMYSq51JZ1rth2AzBqSVass8bxwFxtEQy2L9x"
      );

      const reserve = market.reserves.find(res => res.config.liquidityToken.symbol === 'SOL');
      if (reserve == null) {
        throw 'can\'t find reserve!';
      }

      console.log(`reserve: ${JSON.stringify(reserve?.config.liquidityToken.mint)}`);

      const token = new Token(connection, new PublicKey(reserve!.config.liquidityToken.mint), TOKEN_PROGRAM_ID, payer);
      const tokenAccount = await token.createAccount(payer.publicKey);

      const delegate = Keypair.generate();
      await token.approve(tokenAccount, delegate.publicKey, payer, [], 10);

      let tx = new Transaction();
      tx.add(
        flashBorrowReserveLiquidityInstruction(
          100,
          new PublicKey(reserve.config.liquidityAddress),
          tokenAccount,
          new PublicKey(reserve.config.address),
          new PublicKey(market.config!.address),
          SOLEND_DEVNET_PROGRAM_ID
        ),
        flashRepayReserveLiquidityInstruction(
          100,
          0,
          tokenAccount,
          new PublicKey(reserve.config.liquidityAddress),
          new PublicKey(reserve.config.liquidityFeeReceiverAddress),
          tokenAccount,
          new PublicKey(reserve.config.address),
          new PublicKey(market.config!.address),
          delegate.publicKey,
          SOLEND_DEVNET_PROGRAM_ID
        )
      );
      
      // hard to make this succeed bc i need tokens to pay off the flash loan fee.
      try { 
        await connection.sendTransaction(tx, [payer, delegate]);
      }
      catch (e) {
        console.log("Error found");
        console.log(e);
        return;
      }

      throw 'expected a failure!'
  });
});
