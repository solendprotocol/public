/* eslint-disable no-restricted-syntax,no-continue */
import {
  Account,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from '@solana/web3.js';
import {
  findProtocolFeeAccount,
  IDL_JSON as UNSTAKE_IDL_JSON,
  Unstake,
  unstakeTx,
} from '@unstake-it/sol';
import { Program } from '@project-serum/anchor';
import {
  StakePoolInstruction,
  getStakePoolAccount,
} from '@solana/spl-stake-pool';
import { LAINE_ADDRESS_MAP } from 'libs/unwrap/xsol/splStakePool';
import { getWalletBalance } from 'libs/utils';
import { getAssociatedTokenAddress } from '@solana/spl-token-v2';

const PROG_ID = new PublicKey('unpXTU2Ndrc7WWNyEhQWe4udTzSibLPi25SXv2xbCHQ');
const UNSTAKE_POOL_ADDRESS = new PublicKey(
  'FypPtwbY3FUfzJUtXHSyVRokVKG2jKtH29FmK4ebxRSd',
);

export const checkAndUnwrapXSolTokens = async (
  connection: Connection,
  payer: Account,
) => {
  const [stakePoolWithdrawAuth] = PublicKey.findProgramAddressSync(
    [LAINE_ADDRESS_MAP.stakePool.toBuffer(), Buffer.from('withdraw')],
    LAINE_ADDRESS_MAP.program,
  );
  const [validatorStakeAccount] = PublicKey.findProgramAddressSync(
    [
      LAINE_ADDRESS_MAP.votePubkey.toBuffer(),
      LAINE_ADDRESS_MAP.stakePool.toBuffer(),
    ],
    LAINE_ADDRESS_MAP.program,
  );

  const destinationStake = Keypair.generate();

  const stakePoolAccount = await getStakePoolAccount(
    connection,
    LAINE_ADDRESS_MAP.stakePool,
  );

  const poolTokens = await getWalletBalance(
    connection,
    LAINE_ADDRESS_MAP.stakePoolToken,
    payer.publicKey,
  );

  if (poolTokens === 0) {
    return;
  }

  const poolTokenAccount = await getAssociatedTokenAddress(
    LAINE_ADDRESS_MAP.stakePoolToken,
    payer.publicKey,
  );

  const withdrawInstruction = StakePoolInstruction.withdrawStake({
    stakePool: LAINE_ADDRESS_MAP.stakePool,
    validatorList: LAINE_ADDRESS_MAP.validatorList,
    poolMint: LAINE_ADDRESS_MAP.stakePoolToken,
    withdrawAuthority: stakePoolWithdrawAuth,
    validatorStake: validatorStakeAccount,
    destinationStake: destinationStake.publicKey,
    destinationStakeAuthority: payer.publicKey,
    managerFeeAccount: stakePoolAccount.account.data.managerFeeAccount,
    poolTokens,
    sourcePoolAccount: poolTokenAccount,
    sourceTransferAuthority: payer.publicKey,
  });

  const tx = new Transaction();

  tx.add(withdrawInstruction);

  const UNSTAKE_PROGRAM: Program<Unstake> = new Program(
    UNSTAKE_IDL_JSON as unknown as Unstake,
    PROG_ID,
    { connection },
  );

  const [protocolFeeAddr] = await findProtocolFeeAccount(
    UNSTAKE_PROGRAM.programId,
  );
  const protocolFee = {
    publicKey: protocolFeeAddr,
    account: await UNSTAKE_PROGRAM.account.protocolFee.fetch(protocolFeeAddr),
  };

  const unstakeTransaction = await unstakeTx(UNSTAKE_PROGRAM as any, {
    stakeAccount: payer.publicKey,
    poolAccount: UNSTAKE_POOL_ADDRESS,
    unstaker: payer.publicKey,
    protocolFee,
  });

  tx.add(unstakeTransaction);

  const txHash = await sendAndConfirmTransaction(connection, tx, [payer, destinationStake], {
    commitment: 'confirmed',
  });

  console.log(
    `successfully withdrew ${poolTokens} ${LAINE_ADDRESS_MAP.xSolLabel}: ${txHash}`,
  );
};
