import * as anchor from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  MERKLE_PROGRAM_ID,
  MerkleDistributorJSON,
} from "./utils/merkle_distributor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import axios from "axios";

const toBytes32Array = (b: Buffer): number[] => {
  const buf = Buffer.alloc(32);
  b.copy(buf, 32 - b.length);

  return Array.from(buf);
};

// Return type of /reward-proofs
export type ClaimData = {
  name: string;
  obligationID: string;
  lotNumber: number;
  index: number;
  quantity: string;
  root: string;
  proof: Array<string>;
  distributorPublicKey: PublicKey;
  optionMarketKey: PublicKey | null;
  incentivizer: string;
};

export type FullClaimDataType = ClaimData & {
  accountFunded: boolean;
  claimId: PublicKey;
  claimStatusBump: number;
  claimed: boolean;
  claimedAt: number;
  distributor: {
    mint: PublicKey;
  };
  distributorATAPublicKey: PublicKey;
};

export async function fetchClaimData(
  obligationAddress: PublicKey,
  connection: Connection
): Promise<Array<FullClaimDataType>> {
  const claims = (
    await axios.get(
      `https://api.save.finance/liquidity-mining/reward-proofs?obligation=${obligationAddress.toBase58()}`
    )
  ).data as Array<ClaimData>;

  const provider = new anchor.AnchorProvider(
    connection,
    new NodeWallet(Keypair.fromSeed(new Uint8Array(32).fill(1))),
    {}
  );

  const anchorProgram = new anchor.Program(
    MerkleDistributorJSON,
    new PublicKey(MERKLE_PROGRAM_ID),
    provider
  );

  const merkleDistributors =
    (await anchorProgram.account.merkleDistributor.fetchMultiple(
      claims.map((d) => new PublicKey(d.distributorPublicKey))
    )) as Array<{
      mint: PublicKey;
    }>;

  const claimAndBumps = await Promise.all(
    claims.map(async (d) => {
      const claimAndBump = await PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("ClaimStatus"),
          new anchor.BN(d.index).toArrayLike(Buffer, "le", 8),
          new PublicKey(d.distributorPublicKey).toBytes(),
        ],
        new PublicKey(MERKLE_PROGRAM_ID)
      );

      return claimAndBump;
    })
  );

  const claimStatuses = (await anchorProgram.account.claimStatus.fetchMultiple(
    claimAndBumps.map((candb) => candb[0])
  )) as Array<any>;

  return await Promise.all(
    claims.map(async (d, index) => {
      const [distributorATAPublicKey, _bump] =
        await PublicKey.findProgramAddress(
          [
            new PublicKey(d.distributorPublicKey).toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            merkleDistributors[index].mint.toBuffer(),
          ],
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

      const accountFunded =
        (
          await anchorProgram.provider.connection.getTokenAccountBalance(
            distributorATAPublicKey
          )
        ).value.amount !== "0";

      return {
        ...d,
        accountFunded,
        claimId: claimAndBumps[index][0],
        claimStatusBump: claimAndBumps[index][1],
        claimed: Boolean(claimStatuses[index]?.isClaimed),
        claimedAt: claimStatuses[index]?.claimedAt,
        distributor: merkleDistributors[index],
        distributorATAPublicKey,
      };
    })
  );
}

export async function getClaimIx(
  claimData: FullClaimDataType,
  connection: Connection,
  publicKey: PublicKey
) {
  const provider = new anchor.AnchorProvider(
    connection,
    new NodeWallet(Keypair.fromSeed(new Uint8Array(32).fill(1))),
    {}
  );

  const anchorProgram = new anchor.Program(
    MerkleDistributorJSON,
    new PublicKey(MERKLE_PROGRAM_ID),
    provider
  );
  const claimantTokenAccountAddress = await getAssociatedTokenAddress(
    claimData.distributor.mint,
    publicKey,
    true
  );

  return anchorProgram.instruction.claim(
    claimData.claimStatusBump,
    new anchor.BN(claimData.index),
    new anchor.BN(claimData.quantity),
    claimData.proof.map((p) => toBytes32Array(Buffer.from(p, "hex"))),
    {
      accounts: {
        distributor: claimData.distributorPublicKey,
        claimStatus: claimData.claimId,
        from: claimData.distributorATAPublicKey,
        to: claimantTokenAccountAddress,
        claimant: publicKey,
        payer: publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    }
  );
}
