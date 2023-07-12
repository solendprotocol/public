const isFunction = (value: any): value is Function =>
  typeof value === 'function';

export function runIfFn<T, U>(
  valueOrFn: T | ((...fnArgs: U[]) => T),
  ...args: U[]
): T {
  return isFunction(valueOrFn) ? valueOrFn(...args) : valueOrFn;
}

export const SLOT_RATE = 2;

const errorList = [
  'Failed to unpack instruction data',
  'Account is already initialized',
  'Lamport balance below rent-exempt threshold',
  'Market authority is invalid',
  'Market owner is invalid',
  'Input account owner is not the program plusress',
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
