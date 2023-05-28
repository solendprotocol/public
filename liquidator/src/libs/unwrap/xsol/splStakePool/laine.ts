import { PublicKey } from '@solana/web3.js';
import type { SplStakePoolAccounts } from 'libs/unwrap/xsol/splStakePool';
import { OFFICIAL_SPL_STAKE_POOL_PROGRAM_ID } from 'libs/unwrap/xsol/splStakePool/consts';

export const LAINE_ADDRESS_MAP: SplStakePoolAccounts = {
  program: OFFICIAL_SPL_STAKE_POOL_PROGRAM_ID,
  stakePool: new PublicKey('2qyEeSAWKfU18AFthrF7JA8z8ZCi1yt76Tqs917vwQTV'),
  validatorList: new PublicKey('sHPN95ARJpwN3Yipc22Z3m5118K3czRLBG7WmLDLsMp'),
  stakePoolToken: new PublicKey('LAinEtNLgpmCP9Rvsf5Hn8W6EhNiKLZQti1xfWMLy6X'),
  votePubkey: new PublicKey('GE6atKoWiQ2pt3zL7N13pjNHjdLVys8LinG8qeJLcAiL'),
  xSolLabel: 'laineSOL',
};
