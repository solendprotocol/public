import { Account, Connection, PublicKey } from '@solana/web3.js';
export declare const checkAndUnwrapBasisTokens: (connection: Connection, payer: Account) => Promise<void>;
export declare const unstakeBasis: (connection: Connection, payer: Account, mint: PublicKey, amount: number) => Promise<string>;
