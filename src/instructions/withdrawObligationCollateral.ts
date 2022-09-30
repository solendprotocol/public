import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import * as BufferLayout from "buffer-layout";
import * as Layout from "../utils/layout";
import { LendingInstruction } from "./instruction";

/// Withdraw collateral from an obligation. Requires a refreshed obligation and reserve.
///
/// Accounts expected by this instruction:
///
///   0. `[writable]` Source withdraw reserve collateral supply SPL Token account.
///   1. `[writable]` Destination collateral token account.
///                     Minted by withdraw reserve collateral mint.
///   2. `[]` Withdraw reserve account - refreshed.
///   3. `[writable]` Obligation account - refreshed.
///   4. `[]` Lending market account.
///   5. `[]` Derived lending market authority.
///   6. `[signer]` Obligation owner.
///   7. `[]` Clock sysvar.
///   8. `[]` Token program id.
export const withdrawObligationCollateralInstruction = (
  collateralAmount: number | BN,
  sourceCollateral: PublicKey,
  destinationCollateral: PublicKey,
  withdrawReserve: PublicKey,
  obligation: PublicKey,
  lendingMarket: PublicKey,
  lendingMarketAuthority: PublicKey,
  obligationOwner: PublicKey,
  solendProgramAddress: PublicKey
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    Layout.uint64("collateralAmount"),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.WithdrawObligationCollateral,
      collateralAmount: new BN(collateralAmount),
    },
    data
  );

  const keys = [
    { pubkey: sourceCollateral, isSigner: false, isWritable: true },
    { pubkey: destinationCollateral, isSigner: false, isWritable: true },
    { pubkey: withdrawReserve, isSigner: false, isWritable: false },
    { pubkey: obligation, isSigner: false, isWritable: true },
    { pubkey: lendingMarket, isSigner: false, isWritable: false },
    { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
    { pubkey: obligationOwner, isSigner: true, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({
    keys,
    programId: solendProgramAddress,
    data,
  });
};
