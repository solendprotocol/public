import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
export declare const depositReserveLiquidityInstruction: (liquidityAmount: number | BN, sourceLiquidity: PublicKey, destinationCollateral: PublicKey, reserve: PublicKey, reserveLiquiditySupply: PublicKey, reserveCollateralMint: PublicKey, lendingMarket: PublicKey, lendingMarketAuthority: PublicKey, transferAuthority: PublicKey, solendProgramAddress: PublicKey) => TransactionInstruction;
