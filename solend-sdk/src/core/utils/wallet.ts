import {
  getAssociatedTokenAddress,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  unpackAccount,
} from "@solana/spl-token";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { getBatchMultipleAccountsInfo } from "./utils";
import { TokenMetadata, WalletType } from "../types";

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
        logoUri: tokenMetadata?.logoUri,
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
      logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
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

  const uniqueAssetAccounts = await getBatchMultipleAccountsInfo(
    uniqueAssets.map((asset) => new PublicKey(asset)),
    connection
  );

  const userTokenAssociatedAddresses = await Promise.all(
    uniqueAssetAccounts.map(async (asset, index) => {
      const userTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(uniqueAssets[index]),
        new PublicKey(publicKey),
        true,
        asset?.owner.toBase58() === TOKEN_2022_PROGRAM_ID.toBase58()
      ? TOKEN_2022_PROGRAM_ID
      : undefined

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
          ?  unpackAccount(
            userTokenAssociatedAddresses[index],
            account,
            account?.owner.toBase58() === TOKEN_2022_PROGRAM_ID.toBase58()
              ? TOKEN_2022_PROGRAM_ID
              : undefined
          ) : null
    ),
    nativeSolBalance: new BigNumber(nativeSolBalance).dividedBy(
      LAMPORTS_PER_SOL
    ),
    wSolAddress,
  };
}
