import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { WRAPPER_PROGRAM_ID } from "../core/constants";

const BufferLayout = require("buffer-layout");

// Max repay requires the use of the wrapped program

/// Repay borrowed liquidity to a reserve. Requires a refreshed obligation and reserve.
///
/// Accounts expected by this instruction:
///
///   0. `[writable]` Source liquidity token account.
///                     Minted by repay reserve liquidity mint.
///                     $authority can transfer $liquidity_amount.
///   1. `[writable]` Destination repay reserve liquidity supply SPL Token account.
///   2. `[writable]` Repay reserve account - refreshed.
///   3. `[writable]` Obligation account - refreshed.
///   4. `[]` Lending market account.
///   5. `[]` Derived lending market authority.
///   6. `[signer]` User transfer authority ($authority).
///   7. `[]` Clock sysvar.
///   8. `[]` Token program id.
export const repayMaxObligationLiquidityInstruction = (
  sourceLiquidity: PublicKey,
  destinationLiquidity: PublicKey,
  repayReserve: PublicKey,
  obligation: PublicKey,
  lendingMarket: PublicKey,
  transferAuthority: PublicKey,
  solendProgramAddress: PublicKey
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([BufferLayout.u8("instruction")]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: 1,
    },
    data
  );

  const keys = [
    { pubkey: solendProgramAddress, isSigner: false, isWritable: false },
    { pubkey: sourceLiquidity, isSigner: false, isWritable: true },
    { pubkey: destinationLiquidity, isSigner: false, isWritable: true },
    { pubkey: repayReserve, isSigner: false, isWritable: true },
    { pubkey: obligation, isSigner: false, isWritable: true },
    { pubkey: lendingMarket, isSigner: false, isWritable: false },
    { pubkey: transferAuthority, isSigner: true, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({
    keys,
    programId: WRAPPER_PROGRAM_ID,
    data,
  });
};
