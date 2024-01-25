/// <reference types="@project-serum/anchor/node_modules/@solana/web3.js" />
/// <reference types="@pythnetwork/client/node_modules/@solana/web3.js" />
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { RateLimiterConfig } from "../state/rateLimiter";
export declare const setLendingMarketOwnerAndConfigInstruction: (lendingMarket: PublicKey, currentMarketOwner: PublicKey, newMarketOwner: PublicKey, newRateLimiterConfig: RateLimiterConfig, riskAuthority: PublicKey, lendingProgramId: PublicKey, whitelistedLiquidator?: PublicKey) => TransactionInstruction;
