/// <reference types="@project-serum/anchor/node_modules/@solana/web3.js" />
/// <reference types="@pythnetwork/client/node_modules/@solana/web3.js" />
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
export declare const flashBorrowReserveLiquidityInstruction: (liquidityAmount: number | BN, sourceLiquidity: PublicKey, destinationLiquidity: PublicKey, reserve: PublicKey, lendingMarket: PublicKey, lendingProgramId: PublicKey) => TransactionInstruction;
