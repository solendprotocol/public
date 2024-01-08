import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
export declare const redeemReserveCollateralInstruction: (collateralAmount: number | BN, sourceCollateral: PublicKey, destinationLiquidity: PublicKey, reserve: PublicKey, reserveCollateralMint: PublicKey, reserveLiquiditySupply: PublicKey, lendingMarket: PublicKey, lendingMarketAuthority: PublicKey, transferAuthority: PublicKey, solendProgramAddress: PublicKey) => TransactionInstruction;
