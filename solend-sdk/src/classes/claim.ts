import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { PsyAmericanIdl, getOptionByKey } from "@mithraic-labs/psy-american";
import * as anchor from "@project-serum/anchor";
import { EnrichedClaimType } from "./wallet";
import {
  MERKLE_PROGRAM_ID,
  MerkleDistributorJSON,
} from "../utils/merkle_distributor";

const toBytes32Array = (b: Buffer): number[] => {
  const buf = Buffer.alloc(32);
  b.copy(buf, 32 - b.length);

  return Array.from(buf);
};

export class SolendClaim {
  metadata: EnrichedClaimType;
  provider: anchor.AnchorProvider;

  constructor(metadata: EnrichedClaimType, provider: anchor.AnchorProvider) {
    this.metadata = metadata;
    this.provider = provider;
  }

  async getExerciseIxs(amount: number) {
    if (!this.metadata.optionMarketKey) {
      throw Error(
        "This reward is not an option and does not need to be exercised"
      );
    }
    const psyOptionsProgram = new anchor.Program(
      PsyAmericanIdl,
      new PublicKey("R2y9ip6mxmWUj4pt54jP2hz2dgvMozy9VTSwMWE7evs"),
      this.provider
    ) as any;

    // Mint a bunch of contracts to the minter
    const optionMarket = await getOptionByKey(
      psyOptionsProgram,
      new PublicKey(this.metadata.optionMarketKey)
    );

    if (!optionMarket) {
      throw new Error("Option market with that key is not found.");
    }
    const setupIxs = [];
    const exerciseIxs = [];

    const claimantTokenAccountAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      optionMarket.underlyingAssetMint,
      this.provider.wallet.publicKey,
      true
    );

    const claimantTokenAccountInfo =
      await this.provider.connection.getAccountInfo(
        claimantTokenAccountAddress
      );

    if (!claimantTokenAccountInfo) {
      const createUserTokenAccountIx =
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          optionMarket.underlyingAssetMint,
          claimantTokenAccountAddress,
          this.provider.wallet.publicKey,
          this.provider.wallet.publicKey
        );
      setupIxs.push(createUserTokenAccountIx);
    }

    const exerciserOptionTokenSrc = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      optionMarket.optionMint,
      this.provider.wallet.publicKey
    );
    const underlyingAssetDest = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      optionMarket.underlyingAssetMint,
      this.provider.wallet.publicKey
    );
    const quoteAssetSrc = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      optionMarket.quoteAssetMint,
      this.provider.wallet.publicKey
    );

    if (!optionMarket) {
      throw new Error("Option market with that key is not found.");
    }

    const exerciseOptionIx = psyOptionsProgram.instruction.exerciseOptionV2(
      new anchor.BN(amount),
      {
        accounts: {
          userAuthority: this.provider.wallet.publicKey,
          optionAuthority: this.provider.wallet.publicKey,
          optionMarket: optionMarket.key,
          optionMint: optionMarket.optionMint,
          exerciserOptionTokenSrc,
          underlyingAssetPool: optionMarket.underlyingAssetPool,
          underlyingAssetDest,
          quoteAssetPool: optionMarket.quoteAssetPool,
          quoteAssetSrc,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    );

    exerciseIxs.push(exerciseOptionIx);

    return [setupIxs, exerciseIxs];
  }

  async getClaimIxs() {
    if (!this.metadata.claimable || this.metadata.claimedAt) {
      return [[], []];
    }
    const anchorProgram = new anchor.Program(
      MerkleDistributorJSON,
      new PublicKey(MERKLE_PROGRAM_ID),
      this.provider
    );
    const setupIxs = [];
    const claimIxs = [];

    const claimantTokenAccountAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      this.metadata.distributor.mint,
      this.provider.wallet.publicKey,
      true
    );

    const claimantTokenAccountInfo =
      await this.provider.connection.getAccountInfo(
        claimantTokenAccountAddress
      );

    if (!claimantTokenAccountInfo) {
      const createUserTokenAccountIx =
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          this.metadata.distributor.mint,
          claimantTokenAccountAddress,
          this.provider.wallet.publicKey,
          this.provider.wallet.publicKey
        );
      setupIxs.push(createUserTokenAccountIx);
    }

    const claimIx = anchorProgram.instruction.claim(
      this.metadata.claimStatusBump,
      new anchor.BN(this.metadata.index),
      new anchor.BN(this.metadata.quantity),
      this.metadata.proof.map((p) => toBytes32Array(Buffer.from(p, "hex"))),
      {
        accounts: {
          distributor: this.metadata.distributorPublicKey,
          claimStatus: this.metadata.claimId,
          from: this.metadata.distributorATAPublicKey,
          to: claimantTokenAccountAddress,
          claimant: this.provider.wallet.publicKey,
          payer: this.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    );

    claimIxs.push(claimIx);

    return [setupIxs, claimIxs];
  }

  async claim() {
    const [setupIxs, claimIxs] = await this.getClaimIxs();
    return await this.provider.sendAndConfirm(
      new Transaction().add(...setupIxs, ...claimIxs)
    );
  }
}
