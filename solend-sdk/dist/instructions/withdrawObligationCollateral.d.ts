import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
export declare const withdrawObligationCollateralInstruction: (collateralAmount: number | BN, sourceCollateral: PublicKey, destinationCollateral: PublicKey, withdrawReserve: PublicKey, obligation: PublicKey, lendingMarket: PublicKey, lendingMarketAuthority: PublicKey, obligationOwner: PublicKey, solendProgramAddress: PublicKey) => TransactionInstruction;
