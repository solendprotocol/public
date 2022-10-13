import { Account, Connection, PublicKey } from '@solana/web3.js';
export declare const NAZARE_PROGRAM_ID: PublicKey;
export declare const checkAndUnwrapNLPTokens: (connection: Connection, payer: Account) => Promise<void>;
export declare const getNazareTokenMints: (connection: Connection) => Promise<PublicKey[]>;
export declare const unwrapNazareLp: (connection: Connection, payer: Account, mint: PublicKey, lpAmount: number) => Promise<void>;
