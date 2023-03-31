/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-restricted-syntax */
import {
  Account, Connection, Keypair, PublicKey, Transaction,
} from '@solana/web3.js';
import { GGoldcaSDK, VaultId } from 'ggoldca-sdk';
import { AnchorProvider } from '@project-serum/anchor/dist/cjs/provider';
import { BN, Program, Wallet } from '@project-serum/anchor';
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token-v2';
import { getWalletBalance } from 'libs/utils';
import { Ggoldca, IDL } from './ggoldca';

export const NAZARE_PROGRAM_ID = new PublicKey('NAZAREQQuCnkV8CpkGZaoB6ccmvikM8uRr4GKPWwmPT');

function NazareProgram(connection: Connection, wallet: Wallet): Program<Ggoldca> {
  const provider = new AnchorProvider(connection, wallet, {
    skipPreflight: false,
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });
  return new Program<Ggoldca>(IDL, NAZARE_PROGRAM_ID, provider);
}

async function getNazareVaultData(program: Program<Ggoldca>, mint: PublicKey): Promise<any> {
  const allVaults = await program.account.vaultAccount.all();
  let result;
  allVaults.forEach((vaultData) => {
    const [vaultLpTokenMintPubkey, _bumpLp] = PublicKey.findProgramAddressSync(
      [Buffer.from('mint'), vaultData.publicKey.toBuffer()],
      NAZARE_PROGRAM_ID,
    );
    if (vaultLpTokenMintPubkey.toString() === mint.toString()) {
      result = vaultData;
    }
  });
  return result;
}

export const checkAndUnwrapNLPTokens = async (
  connection: Connection,
  payer: Keypair,
) => {
  // Nazare LP tokens 
  const nazareMints = await getNazareTokenMints(connection);
  for (const mint of nazareMints) {
    // check if wallet has Nazare LP tokens
    const tokenAmount = await getWalletBalance(connection, mint, payer.publicKey);
    if (tokenAmount) {
      await unwrapNazareLp(connection, payer, mint, tokenAmount);
    }
  }
};

export const getNazareTokenMints = async (
  connection: Connection,
) => {
  const program = NazareProgram(connection, Wallet as any);
  const allVaults = await program.account.vaultAccount.all();
  const vaultPubKeys = await Promise.all(
    allVaults.map((vaultData) => vaultData.publicKey),
  );

  return vaultPubKeys.map((publicKey) => {
    const [vaultLpTokenMintPubkey, _bumpLp] = PublicKey.findProgramAddressSync(
      [Buffer.from('mint'), publicKey.toBuffer()],
      NAZARE_PROGRAM_ID,
    );
    return vaultLpTokenMintPubkey;
  });
};

export const unwrapNazareLp = async (
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  lpAmount: number,
) => {
  console.log(`unstaking ${lpAmount} Nazare ${mint}`);
  const program = NazareProgram(connection, Wallet as any);
  const vaultData = await getNazareVaultData(program, mint);
  const vaultId = {
    whirlpool: vaultData.account.whirlpoolId as PublicKey,
    id: new BN(vaultData.account.id),
  } as VaultId;

  const ggClient = new GGoldcaSDK({
    programId: program.programId,
    provider: program.provider,
    connection: program.provider.connection,
  });

  const userTokenAAccount = await getAssociatedTokenAddress(
    vaultData.account.inputTokenAMintPubkey,
    payer.publicKey,
  );
  const userTokenBAccount = await getAssociatedTokenAddress(
    vaultData.account.inputTokenBMintPubkey,
    payer.publicKey,
  );
  const userTokenAAccountData = await program.provider.connection.getAccountInfo(userTokenAAccount);
  const userTokenBAccountData = await program.provider.connection.getAccountInfo(userTokenBAccount);

  const { blockhash, lastValidBlockHeight } = await program.provider.connection.getLatestBlockhash();

  const tx = new Transaction({
    feePayer: payer.publicKey,
    blockhash,
    lastValidBlockHeight,
  });

  // Create the associated token accounts if it doesn't exist
  if (!userTokenAAccountData) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        userTokenAAccount,
        payer.publicKey,
        vaultData.account.inputTokenAMintPubkey,
      ),
    );
  }
  if (!userTokenBAccountData) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        userTokenBAccount,
        payer.publicKey,
        vaultData.account.inputTokenBMintPubkey,
      ),
    );
  }

  tx.add(
    await ggClient.withdrawIx({
      lpAmount: new BN(lpAmount),
      minAmountA: new BN(0),
      minAmountB: new BN(0),
      userSigner: payer.publicKey,
      vaultId,
    }),
  );

  tx.sign(payer);

  const txHash = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false });
  await connection.confirmTransaction(txHash, 'confirmed');

  console.log(`successfully unstaked ${lpAmount} Nazare ${mint}: ${txHash}`);
};
