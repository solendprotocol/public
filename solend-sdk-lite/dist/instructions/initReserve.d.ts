import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import { ReserveConfig } from "../state";
export declare const initReserveInstruction: (liquidityAmount: number | BN, config: ReserveConfig, sourceLiquidity: PublicKey, destinationCollateral: PublicKey, reserve: PublicKey, liquidityMint: PublicKey, liquiditySupply: PublicKey, liquidityFeeReceiver: PublicKey, collateralMint: PublicKey, collateralSupply: PublicKey, pythProduct: PublicKey, pythPrice: PublicKey, switchboardFeed: PublicKey, lendingMarket: PublicKey, lendingMarketAuthority: PublicKey, lendingMarketOwner: PublicKey, transferAuthority: PublicKey, lendingProgramId: PublicKey) => TransactionInstruction;
