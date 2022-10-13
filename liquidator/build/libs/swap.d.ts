import { Jupiter } from '@jup-ag/core';
import { Connection, Keypair } from '@solana/web3.js';
export default function swap(connection: Connection, wallet: Keypair, jupiter: Jupiter, fromTokenInfo: any, toTokenInfo: any, amount: number): Promise<void>;
