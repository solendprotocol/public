import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  Token,
} from "@solana/spl-token";

export async function createAndCloseWSOLAccount(
  connection: Connection,
  publicKey: PublicKey,
  sendTransaction: Function,
  wrapAmountBase: string
) {
  const ixs: TransactionInstruction[] = [];
  const cleanupIxs: TransactionInstruction[] = [];

  const userWSOLAccountAddress = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    NATIVE_MINT,
    publicKey
  );
  const userWSOLAccountInfo = await connection.getAccountInfo(
    userWSOLAccountAddress
  );
  if (userWSOLAccountInfo) {
    const tx = new Transaction().add(
      Token.createCloseAccountInstruction(
        TOKEN_PROGRAM_ID,
        userWSOLAccountAddress,
        publicKey,
        publicKey,
        []
      )
    );
    const { blockhash } = await connection.getRecentBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = publicKey;
    let signature: TransactionSignature = "";
    try {
      signature = await sendTransaction(tx, connection);
      console.log(`submitted tx ${signature}`);
      await connection.confirmTransaction(signature);
      console.log(`confirmed tx ${signature}`);
    } catch (e) {
      console.log(`unwrap sol txn failed`);
      return [];
    }
  }
  const balanceNeeded = await Token.getMinBalanceRentForExemptAccount(
    connection
  );
  const transferLamportsIx = SystemProgram.transfer({
    fromPubkey: publicKey,
    toPubkey: userWSOLAccountAddress,
    lamports: balanceNeeded + parseInt(wrapAmountBase, 10),
  });
  ixs.push(transferLamportsIx);

  const createUserWSOLAccountIx = Token.createAssociatedTokenAccountInstruction(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    NATIVE_MINT,
    userWSOLAccountAddress,
    publicKey,
    publicKey
  );
  ixs.push(createUserWSOLAccountIx);

  const closeWSOLAccountIx = Token.createCloseAccountInstruction(
    TOKEN_PROGRAM_ID,
    userWSOLAccountAddress,
    publicKey,
    publicKey,
    []
  );
  cleanupIxs.push(closeWSOLAccountIx);

  return [ixs, cleanupIxs];
}
