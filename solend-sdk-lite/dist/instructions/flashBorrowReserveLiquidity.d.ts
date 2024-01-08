import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
export declare const flashBorrowReserveLiquidityInstruction: (liquidityAmount: number | BN, sourceLiquidity: PublicKey, destinationLiquidity: PublicKey, reserve: PublicKey, lendingMarket: PublicKey, lendingProgramId: PublicKey) => TransactionInstruction;
