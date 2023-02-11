import {
    Keypair,
    PublicKey,
    SYSVAR_CLOCK_PUBKEY,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction,
  } from '@solana/web3.js';
  import { SolendRPCConnection } from './rpc';
  import { parseObligation } from '../state/obligation';
import { LendingInstruction } from "../instructions/instruction";

  const BufferLayout = require('buffer-layout');

  // Simulates refresh obligation and refresh reserves, returns the updated
  // obligation
  export async function simulateRefreshObligation(
    marketConfig: {
      reserves: Array<{
        address: string
        pythOracle: string
        switchboardOracle: string
      }>,
    },
    connection: SolendRPCConnection,
    obligationId: PublicKey,
    programId: PublicKey,
  ) {
    const obligationAccount = await connection.getAccountInfo(
      obligationId,
    );
    if (obligationAccount === null) {
      return null;
    }

    const obligation = parseObligation(
      obligationId,
      obligationAccount,
    )!;

    const borrowReserves = obligation.info.borrows.map((b) => b.borrowReserve);
    const depositReserves = obligation.info.deposits.map((d) => d.depositReserve);

    const refreshObligationIx = refreshObligationInstruction(
      obligation.pubkey,
      depositReserves,
      borrowReserves,
      programId,
    );

    const ixs: TransactionInstruction[] = [];
    const uniqueReserveAddresses = [
      ...new Set<string>(
        depositReserves.concat(borrowReserves).map(r => r.toBase58()),
      ),
    ];

    uniqueReserveAddresses.forEach((reserveAddress) => {
      const reserveInfo = marketConfig.reserves.filter(
        (r) => r.address === reserveAddress,
      )[0];

      const refreshReserveIx = refreshReserveInstruction(
        new PublicKey(reserveAddress),
        programId,
        new PublicKey(reserveInfo.pythOracle),
        new PublicKey(reserveInfo.switchboardOracle),
      );
      ixs.push(refreshReserveIx);
    });

    ixs.push(refreshObligationIx);
    const blockhash = (await connection.getLatestBlockhash()).blockhash;
    const signer = getMockPayer();
    const messageV0 = new TransactionMessage({
      payerKey: signer.publicKey,
      recentBlockhash: blockhash,
      instructions: ixs,
    }).compileToV0Message();
    const transaction = new VersionedTransaction(messageV0);
    transaction.sign([signer]);
    try {
      const responseAndContext = await connection.simulateTransaction(
        transaction,
        {
          sigVerify: false,
          accounts: {
            encoding: 'base64',
            addresses: [obligationId.toBase58()],
          },
        },
      );

      const response = responseAndContext.value;
      const simulatedObligationAccount = response.accounts![0];

      obligationAccount.data = Buffer.from(
        simulatedObligationAccount!.data[0],
        'base64',
      );
    } catch (e: any) {}

    const simulatedObligation = parseObligation(
      obligationId,
      obligationAccount,
    )!;
    const response = simulatedObligation;
    return response.info!;
  }

  export const refreshObligationInstruction = (
    obligation: PublicKey,
    depositReserves: PublicKey[],
    borrowReserves: PublicKey[],
    programId: PublicKey,
  ): TransactionInstruction => {
    const dataLayout = BufferLayout.struct([BufferLayout.u8('instruction')]);

    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode(
      { instruction: LendingInstruction.RefreshObligation },
      data,
    );

    const keys = [
      { pubkey: obligation, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    ];

    depositReserves.forEach((depositReserve) => {
      keys.push({ pubkey: depositReserve, isSigner: false, isWritable: false });
    });

    borrowReserves.forEach((borrowReserve) => {
      keys.push({ pubkey: borrowReserve, isSigner: false, isWritable: false });
    });

    return new TransactionInstruction({
      keys,
      programId,
      data,
    });
  };

  export const refreshReserveInstruction = (
    reserve: PublicKey,
    programId: PublicKey,
    oracle?: PublicKey,
    switchboardFeedAddress?: PublicKey,
  ): TransactionInstruction => {
    const dataLayout = BufferLayout.struct([BufferLayout.u8('instruction')]);

    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({ instruction: LendingInstruction.RefreshReserve }, data);

    const keys = [{ pubkey: reserve, isSigner: false, isWritable: true }];

    if (oracle) {
      keys.push({ pubkey: oracle, isSigner: false, isWritable: false });
    }

    if (switchboardFeedAddress) {
      keys.push({
        pubkey: switchboardFeedAddress,
        isSigner: false,
        isWritable: false,
      });
    }

    keys.push({
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: false,
    });

    return new TransactionInstruction({
      keys,
      programId,
      data,
    });
  };

  // This account roughly 0.1 SOL, used for simulating paying for transactions.
  const getMockPayer = (): Keypair => {
    return Keypair.fromSecretKey(
      Uint8Array.from([
        174, 131, 219, 35, 193, 235, 20, 236, 34, 234, 85, 51, 205, 92, 1, 88,
        245, 190, 123, 161, 244, 248, 62, 64, 242, 7, 197, 98, 145, 181, 70, 154,
        12, 184, 54, 233, 43, 114, 35, 169, 93, 223, 110, 173, 184, 103, 118, 60,
        231, 15, 203, 58, 78, 119, 175, 117, 109, 159, 251, 191, 132, 151, 185,
        87,
      ]),
    );
  };