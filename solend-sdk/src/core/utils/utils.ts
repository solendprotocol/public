import { Connection, PublicKey } from "@solana/web3.js";
import { RateLimiter } from "../../state/rateLimiter";
import BigNumber from "bignumber.js";

const ADDRESS_PREFIX_SUFFIX_LENGTH = 6;

export const OUTFLOW_BUFFER = 0.985;

export const parseRateLimiter = (rateLimiter: RateLimiter, currentSlot: number) => {
  const convertedRateLimiter = {
    config: {
      windowDuration: new BigNumber(
        rateLimiter.config.windowDuration.toString(),
      ),
      maxOutflow: new BigNumber(
        rateLimiter.config.maxOutflow.toString(),
      ),
    },
    windowStart: new BigNumber(rateLimiter.windowStart.toString()),
    previousQuantity: new BigNumber(
      rateLimiter.previousQuantity.toString(),
    ).shiftedBy(-18),
    currentQuantity: new BigNumber(
      rateLimiter.currentQuantity.toString(),
    ).shiftedBy(-18),
  }
  return {
  ...convertedRateLimiter,
  remainingOutflow: remainingOutflow(currentSlot, convertedRateLimiter)
}};


export const remainingOutflow = (
  currentSlot: number,
  rateLimiter: {
    config: {
      windowDuration: BigNumber,
      maxOutflow: BigNumber,
    },
    windowStart: BigNumber,
    previousQuantity: BigNumber,
    currentQuantity: BigNumber,
  },
) => {
  if (rateLimiter.config.windowDuration.eq(new BigNumber(0))) {
    return null;
  }

  const curSlot = new BigNumber(currentSlot);
  const windowDuration = rateLimiter.config.windowDuration
  const previousQuantity = rateLimiter.previousQuantity;
  const currentQuantity = rateLimiter.currentQuantity;
  const maxOutflow = rateLimiter.config.maxOutflow;
  const windowStart = rateLimiter.windowStart;

  const curSlotStart = curSlot
    .dividedBy(windowDuration)
    .integerValue(BigNumber.ROUND_FLOOR)
    .times(windowDuration);

  const prevWeight = windowDuration
    .minus(curSlot.minus(curSlotStart).plus(new BigNumber(1)))
    .dividedBy(windowDuration);
  let outflow = new BigNumber(0);

  if (windowStart.isEqualTo(curSlotStart)) {
    const curOutflow = prevWeight.times(
      previousQuantity.plus(currentQuantity),
    );
    outflow = maxOutflow.plus(curOutflow);
  } else if (windowStart.plus(windowDuration).isEqualTo(curSlotStart)) {
    const curOutflow = prevWeight.times(currentQuantity);
    outflow = maxOutflow.minus(curOutflow);
  } else {
    outflow = maxOutflow;
  }

  return outflow.times(new BigNumber(OUTFLOW_BUFFER));
};

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
