import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as Layout from "../layout";
import { LendingInstruction } from "./instruction";

const BufferLayout = require("buffer-layout");

/// Deposit collateral to an obligation. Requires a refreshed reserve.
///
/// Accounts expected by this instruction:
///
///   0. `[writable]` Source collateral token account.
///                     Minted by deposit reserve collateral mint.
///                     $authority can transfer $collateral_amount.
///   1. `[writable]` Destination deposit reserve collateral supply SPL Token account.
///   2. `[]` Deposit reserve account - refreshed.
///   3. `[writable]` Obligation account.
///   4. `[]` Lending market account.
///   5. `[signer]` Obligation owner.
///   6. `[signer]` User transfer authority ($authority).
///   7. `[]` Clock sysvar.
///   8. `[]` Token program id.
export const depositObligationCollateralInstruction = (
  collateralAmount: number | BN,
  sourceCollateral: PublicKey,
  destinationCollateral: PublicKey,
  depositReserve: PublicKey,
  obligation: PublicKey,
  lendingMarket: PublicKey,
  obligationOwner: PublicKey,
  transferAuthority: PublicKey,
  solendProgramAddress: PublicKey
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    Layout.uint64("collateralAmount"),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.DepositObligationCollateral,
      collateralAmount: new BN(collateralAmount),
    },
    data
  );

  const keys = [
    { pubkey: sourceCollateral, isSigner: false, isWritable: true },
    { pubkey: destinationCollateral, isSigner: false, isWritable: true },
    { pubkey: depositReserve, isSigner: false, isWritable: false },
    { pubkey: obligation, isSigner: false, isWritable: true },
    { pubkey: lendingMarket, isSigner: false, isWritable: false },
    { pubkey: obligationOwner, isSigner: true, isWritable: false },
    { pubkey: transferAuthority, isSigner: true, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: solendProgramAddress,
    data,
  });
};
