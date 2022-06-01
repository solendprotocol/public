import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
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

  async getClaimTransaction() {
    const anchorProgram = new anchor.Program(
      MerkleDistributorJSON,
      new PublicKey(MERKLE_PROGRAM_ID),
      this.provider
    );
    const ixs = [];

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
      ixs.push(createUserTokenAccountIx);
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

    ixs.push(claimIx);

    return new Transaction().add(...ixs);
  }

  async claim() {
    return await this.provider.sendAndConfirm(await this.getClaimTransaction());
  }
}
