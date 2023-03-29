/* eslint-disable no-unused-vars */
import { Connection, PublicKey } from "@solana/web3.js";
import {
  SOLEND_PRODUCTION_PROGRAM_ID,
  RESERVE_SIZE,
  parseReserve,
} from "../../dist";
import { getAccount } from "@solana/spl-token";

const MSOL_MINT_PUBKEY = "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So";
// clone and replace with your rpc else this will probably error
const SOLANA_RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";

const connection = new Connection(SOLANA_RPC_ENDPOINT);

const main = async () => {
  const resp = await connection.getProgramAccounts(
    new PublicKey(SOLEND_PRODUCTION_PROGRAM_ID),
    {
      commitment: connection.commitment,
      filters: [
        {
          dataSize: RESERVE_SIZE,
        },
      ],
      encoding: "base64",
    }
  );

  const reserves = resp.map((account) =>
    parseReserve(account.pubkey, account.account, "base64")
  );

  const msolReserves = reserves.filter(
    (reserve) =>
      reserve?.info.liquidity.mintPubkey.toBase58() === MSOL_MINT_PUBKEY
  );

  const msolTokenAccounts = await Promise.all(
    msolReserves.map(
      async (reserve) =>
        await getAccount(connection, reserve?.info.liquidity.supplyPubkey!)
    )
  );

  const msolBalances = msolTokenAccounts.map(
    (tokenAccounts) => tokenAccounts.amount
  );

  console.log(msolBalances.reduce((a, b) => a + b).toString());
};

main();
