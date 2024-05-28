import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import * as Layout from "../layout";
import { WRAPPER_PROGRAM_ID } from "../core/constants";

const BufferLayout = require("buffer-layout");

/// Deposit liquidity into a reserve in exchange for collateral, and deposit the collateral as well.
export const withdrawExact = (
  liquidityAmount: number | BN,
  reserveCollateral: PublicKey,
  userCollateral: PublicKey,
  withdrawReserve: PublicKey,
  userLiquidity: PublicKey,
  reserveCollateralMint: PublicKey,
  reserveLiquiditySupply: PublicKey,
  obligation: PublicKey,
  lendingMarket: PublicKey,
  lendingMarketAuthority: PublicKey,
  obligationOwner: PublicKey,
  transferAuthority: PublicKey,
  solendProgramAddress: PublicKey,
  depositReserves: Array<PublicKey>
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    Layout.uint64("liquidityAmount"),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: 3,
      liquidityAmount: new BN(liquidityAmount),
    },
    data
  );

  const keys = [
    { pubkey: solendProgramAddress, isSigner: false, isWritable: false },
    { pubkey: reserveCollateral, isSigner: false, isWritable: true },
    { pubkey: userCollateral, isSigner: false, isWritable: true },
    { pubkey: withdrawReserve, isSigner: false, isWritable: true },
    { pubkey: obligation, isSigner: false, isWritable: true },
    { pubkey: lendingMarket, isSigner: false, isWritable: true },
    { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
    { pubkey: userLiquidity, isSigner: false, isWritable: true },
    { pubkey: reserveCollateralMint, isSigner: false, isWritable: true },
    { pubkey: reserveLiquiditySupply, isSigner: false, isWritable: true },
    { pubkey: obligationOwner, isSigner: true, isWritable: false },
    { pubkey: transferAuthority, isSigner: true, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ...depositReserves.map((reserve) => ({
      pubkey: reserve,
      isSigner: false,
      isWritable: true,
    })),
  ];
  return new TransactionInstruction({
    keys,
    programId: WRAPPER_PROGRAM_ID,
    data,
  });
};
