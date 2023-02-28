import {
  getAssociatedTokenAddress,
  NATIVE_MINT,
  unpackAccount,
} from "@solana/spl-token";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { TokenMetadata, WalletType } from "../types";
import { getBatchMultipleAccountsInfo } from "./utils";

export function formatWalletAssets(
  rawWalletData: Awaited<ReturnType<typeof fetchWalletAssets>>,
  metadata: TokenMetadata
) {
  const { userAssociatedTokenAccounts, wSolAddress, nativeSolBalance } =
    rawWalletData;
  const assets = userAssociatedTokenAccounts
    .map((parsedAccount) => {
      if (!parsedAccount) return null;
      const mintAddress = parsedAccount.mint.toBase58();
      const tokenMetadata = metadata[mintAddress];
      const decimals = tokenMetadata?.decimals ?? 0;

      return {
        decimals,
        symbol:
          tokenMetadata?.symbol === "SOL" ? "wSOL" : tokenMetadata?.symbol,
        address: parsedAccount.address.toBase58(),
        amount: new BigNumber(parsedAccount.amount.toString()).shiftedBy(
          -decimals
        ),
        mintAddress: tokenMetadata?.symbol === "SOL" ? "wSOL" : mintAddress,
      };
    })
    .filter(Boolean) as WalletType;

  return assets.concat([
    {
      decimals: Math.log10(LAMPORTS_PER_SOL),
      symbol: "SOL",
      address: wSolAddress,
      amount: nativeSolBalance,
      mintAddress: NATIVE_MINT.toBase58(),
    },
  ]);
}

export async function fetchWalletAssets(
  uniqueAssets: Array<string>,
  publicKey: string,
  connection: Connection,
  debug?: boolean
) {
  if (debug) console.log("fetchWalletAssets", uniqueAssets.length);
  const userTokenAssociatedAddresses = await Promise.all(
    uniqueAssets.map(async (asset) => {
      const userTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(asset),
        new PublicKey(publicKey),
        true
      );
      return userTokenAccount;
    })
  );

  const userAssociatedTokenAccounts = await getBatchMultipleAccountsInfo(
    userTokenAssociatedAddresses,
    connection
  );

  const nativeSolBalance = await connection.getBalance(
    new PublicKey(publicKey)
  );

  const wSolAddress = (
    await getAssociatedTokenAddress(NATIVE_MINT, new PublicKey(publicKey), true)
  ).toBase58();

  return {
    userAssociatedTokenAccounts: userAssociatedTokenAccounts.map(
      (account, index) =>
        account
          ? unpackAccount(userTokenAssociatedAddresses[index], account)
          : null
    ),
    nativeSolBalance: new BigNumber(nativeSolBalance).dividedBy(
      LAMPORTS_PER_SOL
    ),
    wSolAddress,
  };
}
