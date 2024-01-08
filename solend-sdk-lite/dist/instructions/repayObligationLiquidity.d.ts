import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
export declare const repayObligationLiquidityInstruction: (liquidityAmount: number | BN, sourceLiquidity: PublicKey, destinationLiquidity: PublicKey, repayReserve: PublicKey, obligation: PublicKey, lendingMarket: PublicKey, transferAuthority: PublicKey, solendProgramAddress: PublicKey) => TransactionInstruction;
