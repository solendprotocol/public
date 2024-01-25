/// <reference types="node" />
/// <reference types="@project-serum/anchor/node_modules/@solana/web3.js" />
/// <reference types="@pythnetwork/client/node_modules/@solana/web3.js" />
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
export declare const initLendingMarketInstruction: (owner: PublicKey, quoteCurrency: Buffer, lendingMarket: PublicKey, lendingProgramId: PublicKey, oracleProgramId: PublicKey, switchboardProgramId: PublicKey) => TransactionInstruction;
