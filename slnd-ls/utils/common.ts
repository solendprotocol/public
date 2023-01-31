import { Connection, PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./config";

export async function getBatchMultipleAccountsInfo(addresses: Array<string | PublicKey>, connection: Connection) {
    const keys = addresses.map(add => new PublicKey(add))   ;
    const res = keys.reduce((acc, _curr, i) => {
        if (!(i % 100)) {
          // if index is 0 or can be divided by the `size`...
          acc.push(keys.slice(i, i + 100)); // ..push a chunk of the original array to the accumulator
        }
        return acc;
      }, [] as PublicKey[][]);
    
      return (await Promise.all(
          res.map((accountGroup) =>
            connection.getMultipleAccountsInfo(accountGroup, 'processed'),
          ),
        )).flatMap(x => x);
} 

export async function createObligationAddress(publicKey: string, marketAddress: string) {
  return (await PublicKey.createWithSeed(
    new PublicKey(publicKey),
    marketAddress.slice(0, 32),
    PROGRAM_ID
  )).toBase58()
}