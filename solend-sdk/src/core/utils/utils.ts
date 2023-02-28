import { Connection, PublicKey } from "@solana/web3.js";

const ADDRESS_PREFIX_SUFFIX_LENGTH = 6;

export const formatAddress = (address: string, length?: number) => {
  return `${address.slice(
    0,
    length ?? ADDRESS_PREFIX_SUFFIX_LENGTH
  )}...${address.slice(-(length ?? ADDRESS_PREFIX_SUFFIX_LENGTH))}`;
};

export const titleCase = (name: string) => {
  return name.charAt(0).toUpperCase().concat(name.slice(1));
};

export async function getBatchMultipleAccountsInfo(
  addresses: Array<string | PublicKey>,
  connection: Connection
) {
  const keys = addresses.map((add) => new PublicKey(add));
  const res = keys.reduce((acc, _curr, i) => {
    if (!(i % 100)) {
      // if index is 0 or can be divided by the `size`...
      acc.push(keys.slice(i, i + 100)); // ..push a chunk of the original array to the accumulator
    }
    return acc;
  }, [] as PublicKey[][]);

  return (
    await Promise.all(
      res.map((accountGroup) =>
        connection.getMultipleAccountsInfo(accountGroup, "processed")
      )
    )
  ).flatMap((x) => x);
}

export async function createObligationAddress(
  publicKey: string,
  marketAddress: string,
  programId: string
) {
  return (
    await PublicKey.createWithSeed(
      new PublicKey(publicKey),
      marketAddress.slice(0, 32),
      new PublicKey(programId)
    )
  ).toBase58();
}

export function computeExtremeRates(configRate: number) {
  const rate = 0.5;
  let cleanRate = configRate;

  if (configRate >= 2.47) {
    cleanRate = Number(configRate.toString().replace(".", ""));
  }

  switch (cleanRate) {
    case 251:
      return rate * 6;
    case 252:
      return rate * 7;
    case 253:
      return rate * 8;
    case 254:
      return rate * 10;
    case 255:
      return rate * 12;
    case 250:
      return rate * 20;
    case 249:
      return rate * 30;
    case 248:
      return rate * 40;
    case 247:
      return rate * 50;
    default:
      return cleanRate;
  }
}
