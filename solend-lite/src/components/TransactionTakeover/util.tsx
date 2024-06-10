import { Connection, Transaction } from '@solana/web3.js';
import { SolendActionCore } from '@solendprotocol/solend-sdk';

export async function sendAndConfirmStrategy(
  action: SolendActionCore,
  connection: Connection,
  sendTransaction: (
    transaction: Transaction,
    connection: Connection,
    options: { skipPreflight: boolean },
  ) => Promise<string>,
  signAllTransactions?: (
    transactions: Array<Transaction>,
  ) => Promise<Array<Transaction>>,
  signCallback?: () => void,
  preCallback?: () => void,
  lendingCallback?: () => void,
  postCallback?: () => void,
  skipPreflight: boolean = false,
) {
  const { preLendingTxn, lendingTxn, postLendingTxn } =
    await action.getLegacyTransactions();

  const txnArray = [preLendingTxn, lendingTxn, postLendingTxn].filter(
    (x) => x,
  ) as Array<Transaction>;

  const transactionCallbacks = [
    preCallback,
    lendingCallback,
    postCallback,
  ].filter((x) => x) as Array<() => void>;

  if (!signAllTransactions) {
    const signatures = [];
    if (signCallback) {
      signCallback();
    }
    for (const [index, transaction] of Array.from(txnArray.entries())) {
      const signature = await sendTransaction(transaction, connection, {
        skipPreflight,
      });
      const confirmationCallback = transactionCallbacks?.[index];
      if (confirmationCallback) {
        confirmationCallback();
      }
      await connection.confirmTransaction(signature, 'single');

      signatures.push(signature);
    }

    return signatures;
  }

  if (signCallback) {
    signCallback();
  }
  const signedTransactions = await signAllTransactions(txnArray);

  const signatures: string[] = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [index, txn] of Array.from(signedTransactions.entries())) {
    const serializedTransaction = txn.serialize();
    const signature = await connection.sendRawTransaction(
      serializedTransaction,
      { skipPreflight },
    );

    const confirmationCallback = transactionCallbacks?.[index];
    if (confirmationCallback) {
      confirmationCallback();
    }

    await connection.confirmTransaction(signature, 'confirmed');
    signatures.push(signature);
  }

  return signatures;
}
