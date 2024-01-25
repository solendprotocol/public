/// <reference types="@project-serum/anchor/node_modules/@solana/web3.js" />
/// <reference types="@pythnetwork/client/node_modules/@solana/web3.js" />
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
export declare const withdrawObligationCollateralAndRedeemReserveLiquidity: (collateralAmount: number | BN, sourceCollateral: PublicKey, destinationCollateral: PublicKey, withdrawReserve: PublicKey, obligation: PublicKey, lendingMarket: PublicKey, lendingMarketAuthority: PublicKey, destinationLiquidity: PublicKey, reserveCollateralMint: PublicKey, reserveLiquiditySupply: PublicKey, obligationOwner: PublicKey, transferAuthority: PublicKey, solendProgramAddress: PublicKey) => TransactionInstruction;
