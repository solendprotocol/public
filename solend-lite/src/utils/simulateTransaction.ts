import {
  Keypair,
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
  TransactionMessage,
  Connection,
  VersionedTransaction,
} from '@solana/web3.js';
import { PoolType } from 'stores/pools';
import {
  parseObligation,
  LendingInstruction,
} from '@solendprotocol/solend-sdk';
import { PROGRAM_ID } from '../common/config';

const BufferLayout = require('buffer-layout');

// Simulates refresh obligation and refresh reserves, returns the updated
// obligation
export async function simulateRefreshObligation(
  config: PoolType,
  connection: Connection,
  obligationAddress: PublicKey,
) {
  const obligationAccount = await connection.getAccountInfo(obligationAddress);

  if (obligationAccount === null) {
    return null;
  }

  const obligation = parseObligation(obligationAddress, obligationAccount)!;

  const borrowReserves = obligation.info.borrows.map((b) => b.borrowReserve);
  const depositReserves = obligation.info.deposits.map((d) => d.depositReserve);

  const refreshObligationIx = refreshObligationInstruction(
    obligationAddress,
    depositReserves,
    borrowReserves,
  );

  const ixs: TransactionInstruction[] = [];
  const reserveAddresses = depositReserves.concat(borrowReserves);
  const uniqueReserveAddresses = reserveAddresses.filter(
    (item, pos) =>
      reserveAddresses.findIndex((address) => address.equals(item)) === pos,
  );

  uniqueReserveAddresses.forEach((reserveAddress) => {
    const reserveInfo = config.reserves.find(
      (r) => r.address === reserveAddress.toBase58(),
    );

    if (!reserveInfo) {
      throw Error('Reserve not found for the obligation.');
    }

    const refreshReserveIx = refreshReserveInstruction(
      reserveAddress,
      new PublicKey(reserveInfo.pythOracle),
      new PublicKey(reserveInfo.switchboardOracle),
    );
    ixs.push(refreshReserveIx);
  });

  ixs.push(refreshObligationIx);
  const { blockhash } = await connection.getLatestBlockhash();
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
          addresses: [obligationAddress.toBase58()],
        },
      },
    );

    const response = responseAndContext.value;
    const simulatedObligationAccount = response.accounts![0];

    obligationAccount.data = Buffer.from(
      simulatedObligationAccount!.data[0],
      'base64',
    );
  } catch (e: any) {
    console.error(e);
  }

  const simulatedObligation = parseObligation(
    obligationAddress,
    obligationAccount,
  )!;
  const response = simulatedObligation;
  return response;
}

export const refreshObligationInstruction = (
  obligation: PublicKey,
  depositReserves: PublicKey[],
  borrowReserves: PublicKey[],
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
    programId: PROGRAM_ID,
    data,
  });
};

export const refreshReserveInstruction = (
  reserve: PublicKey,
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
    programId: PROGRAM_ID,
    data,
  });
};

// This account roughly 0.1 SOL, used for simulating paying for transactions.
const getMockPayer = (): Keypair =>
  Keypair.fromSecretKey(
    Uint8Array.from([
      174, 131, 219, 35, 193, 235, 20, 236, 34, 234, 85, 51, 205, 92, 1, 88,
      245, 190, 123, 161, 244, 248, 62, 64, 242, 7, 197, 98, 145, 181, 70, 154,
      12, 184, 54, 233, 43, 114, 35, 169, 93, 223, 110, 173, 184, 103, 118, 60,
      231, 15, 203, 58, 78, 119, 175, 117, 109, 159, 251, 191, 132, 151, 185,
      87,
    ]),
  );
