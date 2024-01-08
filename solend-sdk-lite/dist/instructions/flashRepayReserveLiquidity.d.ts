import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
export declare const flashRepayReserveLiquidityInstruction: (liquidityAmount: number | BN, borrowInstructionIndex: number, sourceLiquidity: PublicKey, destinationLiquidity: PublicKey, reserveLiquidityFeeReceiver: PublicKey, hostFeeReceiver: PublicKey, reserve: PublicKey, lendingMarket: PublicKey, userTransferAuthority: PublicKey, lendingProgramId: PublicKey) => TransactionInstruction;
