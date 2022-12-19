import type { PublicKey } from '@solana/web3.js';

export type SplStakePoolAccounts = {
  program: PublicKey;
  stakePool: PublicKey;
  /**
   * This can be read from the stake pool struct but
   * we are updating accounts in one-shot so we need to know this beforehand
   */
  validatorList: PublicKey;
  stakePoolToken: PublicKey;
  votePubkey: PublicKey;
  xSolLabel: string;
};

export * from './laine';
