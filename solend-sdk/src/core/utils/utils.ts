import { Connection, PublicKey } from "@solana/web3.js";
import { RateLimiter } from "../../state/rateLimiter";
import BigNumber from "bignumber.js";
import axios from "axios";
import { chunk } from "@metaplex-foundation/js";

const ADDRESS_PREFIX_SUFFIX_LENGTH = 6;

export const OUTFLOW_BUFFER = 0.985;

export const parseRateLimiter = (
  rateLimiter: RateLimiter,
  currentSlot: number
) => {
  const convertedRateLimiter = {
    config: {
      windowDuration: new BigNumber(
        rateLimiter.config.windowDuration.toString()
      ),
      maxOutflow: new BigNumber(rateLimiter.config.maxOutflow.toString()),
    },
    windowStart: new BigNumber(rateLimiter.windowStart.toString()),
    previousQuantity: new BigNumber(
      rateLimiter.previousQuantity.toString()
    ).shiftedBy(-18),
    currentQuantity: new BigNumber(
      rateLimiter.currentQuantity.toString()
    ).shiftedBy(-18),
  };
  return {
    ...convertedRateLimiter,
    remainingOutflow: remainingOutflow(currentSlot, convertedRateLimiter),
  };
};

export const remainingOutflow = (
  currentSlot: number,
  rateLimiter: {
    config: {
      windowDuration: BigNumber;
      maxOutflow: BigNumber;
    };
    windowStart: BigNumber;
    previousQuantity: BigNumber;
    currentQuantity: BigNumber;
  }
) => {
  if (rateLimiter.config.windowDuration.eq(new BigNumber(0))) {
    return null;
  }

  const curSlot = new BigNumber(currentSlot);
  const windowDuration = rateLimiter.config.windowDuration;
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
    const curOutflow = prevWeight.times(previousQuantity.plus(currentQuantity));
    outflow = maxOutflow.minus(curOutflow);
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


export async function rpcRequest (url: string, body: any, retries = 3, timeoutSec = 30): Promise<any> {
  try {
    const { data } = await axios.post(url, body, { timeout: timeoutSec * 1000 });

    if (data?.error) {
      // we want to retry when response has an error
      throw new Error('Retry');
    }
    return data;
  } catch (e) {
    return retries > 0 ? rpcRequest(url, body, retries - 1, timeoutSec) : null;
  }
}

export async function getMultipleAccounts (url: string, accounts: string[], encoding: "jsonParsed" | "base64" = 'base64') {
  const CHUNK_ACCOUNTS_PER_RPC_CALL = 100;
  const CHUNK_RPC_CALLS = 10;

  const rpcCalls = chunk(accounts, CHUNK_ACCOUNTS_PER_RPC_CALL).map((chunk) => ({
    jsonrpc: '2.0',
    id: 42,
    method: 'getMultipleAccounts',
    params: [ chunk, { encoding } ]
  }));

  const allCalls = [] as any;
  const batches = chunk(rpcCalls, CHUNK_RPC_CALLS);
  for (let i = 0; i < batches.length; i++) {
    const response = await Promise.all(
      batches[i].map((chunk) =>
        rpcRequest(url, chunk)
      )
    );

    allCalls.push(response);
  }

  return allCalls.flatten((x:any) => x).map((response:any) => response ? response.result.value : null).map((acc: any, index: number) => acc ? ({ ...acc, pubkey: accounts[index] }) : null).filter(Boolean);
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

const errorList = [
  "Failed to unpack instruction data",
  "Account is already initialized",
  "Lamport balance below rent-exempt threshold",
  "Market authority is invalid",
  "Market owner is invalid",
  "Input account owner is not the program plusress",
  "Input token account is not owned by the correct token program id",
  "Input token account is not valid",
  "Input token mint account is not valid",
  "Input token program account is not valid",
  "Input amount is invalid",
  "Input config value is invalid",
  "Input account must be a signer",
  "Invalid account input",
  "Math operation overflow",
  "Token initialize mint failed",
  "Token initialize account failed",
  "Token transfer failed",
  "Token mint to failed",
  "Token burn failed",
  "Insufficient liquidity available",
  "Input reserve has collateral disabled",
  "Reserve state needs to be refreshed",
  "Withdraw amount too small",
  "Withdraw amount too large",
  "Borrow amount too small to receive liquidity after fees",
  "Borrow amount too large for deposited collateral",
  "Repay amount too small to transfer liquidity",
  "Liquidation amount too small to receive collateral",
  "Cannot liquidate healthy obligations",
  "Obligation state needs to be refreshed",
  "Obligation reserve limit exceeded",
  "Obligation owner is invalid",
  "Obligation deposits are empty",
  "Obligation borrows are empty",
  "Obligation deposits have zero value",
  "Obligation borrows have zero value",
  "Invalid obligation collateral",
  "Invalid obligation liquidity",
  "Obligation collateral is empty",
  "Obligation liquidity is empty",
  "Interest rate is negative",
  "Input oracle config is invalid",
  "Input flash loan receiver program account is not valid",
  "Not enough liquidity after flash loan",
  "Null oracle config",
];

export function formatErrorMsg(errorMessage: string) {
  const error = errorMessage.split(": 0x")[1];
  if (!error) {
    return errorMessage;
  }
  return `${errorMessage}\n${errorList[parseInt(error, 16)]}`;
}
