import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from '../common/config';

export async function getBatchMultipleAccountsInfo(
  addresses: Array<string | PublicKey>,
  connection: Connection,
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
        connection.getMultipleAccountsInfo(accountGroup, 'processed'),
      ),
    )
  ).flatMap((x) => x);
}

export async function createObligationAddress(
  publicKey: string,
  marketAddress: string,
) {
  return (
    await PublicKey.createWithSeed(
      new PublicKey(publicKey),
      marketAddress.slice(0, 32),
      PROGRAM_ID,
    )
  ).toBase58();
}

export function computeExtremeRates(configRate: number) {
  const rate = 0.5;
  let cleanRate = configRate;

  if (configRate >= 2.47) {
    cleanRate = Number(configRate.toString().replace('.', ''));
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

const isFunction = (value: any): value is Function =>
  typeof value === 'function';

export function runIfFn<T, U>(
  valueOrFn: T | ((...fnArgs: U[]) => T),
  ...args: U[]
): T {
  return isFunction(valueOrFn) ? valueOrFn(...args) : valueOrFn;
}

const errorList = [
  'Failed to unpack instruction data',
  'Account is already initialized',
  'Lamport balance below rent-exempt threshold',
  'Market authority is invalid',
  'Market owner is invalid',
  'Input account owner is not the program address',
  'Input token account is not owned by the correct token program id',
  'Input token account is not valid',
  'Input token mint account is not valid',
  'Input token program account is not valid',
  'Input amount is invalid',
  'Input config value is invalid',
  'Input account must be a signer',
  'Invalid account input',
  'Math operation overflow',
  'Token initialize mint failed',
  'Token initialize account failed',
  'Token transfer failed',
  'Token mint to failed',
  'Token burn failed',
  'Insufficient liquidity available',
  'Input reserve has collateral disabled',
  'Reserve state needs to be refreshed',
  'Withdraw amount too small',
  'Withdraw amount too large',
  'Borrow amount too small to receive liquidity after fees',
  'Borrow amount too large for deposited collateral',
  'Repay amount too small to transfer liquidity',
  'Liquidation amount too small to receive collateral',
  'Cannot liquidate healthy obligations',
  'Obligation state needs to be refreshed',
  'Obligation reserve limit exceeded',
  'Obligation owner is invalid',
  'Obligation deposits are empty',
  'Obligation borrows are empty',
  'Obligation deposits have zero value',
  'Obligation borrows have zero value',
  'Invalid obligation collateral',
  'Invalid obligation liquidity',
  'Obligation collateral is empty',
  'Obligation liquidity is empty',
  'Interest rate is negative',
  'Input oracle config is invalid',
  'Input flash loan receiver program account is not valid',
  'Not enough liquidity after flash loan',
  'Null oracle config',
];
export function formatErrorMsg(errorMessage: string) {
  const error = errorMessage.split(': 0x')[1];
  if (!error) {
    return errorMessage;
  }
  return `${errorMessage}\n${errorList[parseInt(error, 16)]}`;
}
