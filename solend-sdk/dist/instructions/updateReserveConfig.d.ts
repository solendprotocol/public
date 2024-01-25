/// <reference types="@project-serum/anchor/node_modules/@solana/web3.js" />
/// <reference types="@pythnetwork/client/node_modules/@solana/web3.js" />
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { RateLimiterConfig } from "../state/rateLimiter";
import { ReserveConfig } from "../state/reserve";
export declare const updateReserveConfig: (reserve: PublicKey, lendingMarket: PublicKey, lendingMarketAuthority: PublicKey, lendingMarketOwner: PublicKey, pythProduct: PublicKey, pythPrice: PublicKey, switchboardOracle: PublicKey, reserveConfig: ReserveConfig, rateLimiterConfig: RateLimiterConfig, solendProgramAddress: PublicKey) => TransactionInstruction;
