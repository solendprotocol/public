import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { WRAPPER_PROGRAM_ID } from "./repayMaxObligationLiquidity";

const BufferLayout = require("buffer-layout");

/// Deposit liquidity into a reserve in exchange for collateral, and deposit the collateral as well.
export const depositMaxReserveLiquidityAndObligationCollateralInstruction = (
  sourceLiquidity: PublicKey,
  sourceCollateral: PublicKey,
  reserve: PublicKey,
  reserveLiquiditySupply: PublicKey,
  reserveCollateralMint: PublicKey,
  lendingMarket: PublicKey,
  lendingMarketAuthority: PublicKey,
  destinationCollateral: PublicKey,
  obligation: PublicKey,
  obligationOwner: PublicKey,
  pythOracle: PublicKey,
  switchboardFeedAddress: PublicKey,
  transferAuthority: PublicKey,
  solendProgramAddress: PublicKey
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([BufferLayout.u8("instruction")]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: 2,
    },
    data
  );

  const keys = [
    { pubkey: solendProgramAddress, isSigner: false, isWritable: false },
    { pubkey: sourceLiquidity, isSigner: false, isWritable: true },
    { pubkey: sourceCollateral, isSigner: false, isWritable: true },
    { pubkey: reserve, isSigner: false, isWritable: true },
    { pubkey: reserveLiquiditySupply, isSigner: false, isWritable: true },
    { pubkey: reserveCollateralMint, isSigner: false, isWritable: true },
    { pubkey: lendingMarket, isSigner: false, isWritable: true },
    { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
    { pubkey: destinationCollateral, isSigner: false, isWritable: true },
    { pubkey: obligation, isSigner: false, isWritable: true },
    { pubkey: obligationOwner, isSigner: true, isWritable: false },
    { pubkey: pythOracle, isSigner: false, isWritable: false },
    { pubkey: switchboardFeedAddress, isSigner: false, isWritable: false },
    { pubkey: transferAuthority, isSigner: true, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({
    keys,
    programId: WRAPPER_PROGRAM_ID,
    data,
  });
};
