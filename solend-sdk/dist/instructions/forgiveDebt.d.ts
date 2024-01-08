import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
export declare const forgiveDebtInstruction: (obligation: PublicKey, reserve: PublicKey, lendingMarket: PublicKey, lendingMarketOwner: PublicKey, liquidityAmount: number | BN, lendingProgramId: PublicKey) => TransactionInstruction;
