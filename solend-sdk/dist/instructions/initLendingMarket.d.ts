/// <reference types="node" />
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
export declare const initLendingMarketInstruction: (owner: PublicKey, quoteCurrency: Buffer, lendingMarket: PublicKey, lendingProgramId: PublicKey, oracleProgramId: PublicKey, switchboardProgramId: PublicKey) => TransactionInstruction;
