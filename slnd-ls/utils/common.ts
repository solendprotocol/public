import { Connection, PublicKey } from "@solana/web3.js";

export async function getBatchMultipleAccountsInfo(addresses: Array<PublicKey>, connection: Connection) {
      const res = addresses.reduce((acc, _curr, i) => {
        if (!(i % 100)) {
          // if index is 0 or can be divided by the `size`...
          acc.push(addresses.slice(i, i + 100)); // ..push a chunk of the original array to the accumulator
        }
        return acc;
      }, [] as PublicKey[][]);
    
      return (await Promise.all(
          res.map((accountGroup) =>
            connection.getMultipleAccountsInfo(accountGroup, 'processed'),
          ),
        )).flatMap(x => x);
} 