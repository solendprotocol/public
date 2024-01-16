import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
export declare const borrowObligationLiquidityInstruction: (liquidityAmount: number | BN, sourceLiquidity: PublicKey, destinationLiquidity: PublicKey, borrowReserve: PublicKey, borrowReserveLiquidityFeeReceiver: PublicKey, obligation: PublicKey, lendingMarket: PublicKey, lendingMarketAuthority: PublicKey, obligationOwner: PublicKey, solendProgramAddress: PublicKey, hostFeeReceiver?: PublicKey) => TransactionInstruction;
