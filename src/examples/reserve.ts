import { Connection, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { getReserveInfo, WAD } from './common';
import { parseReserve, Reserve } from '../state/reserve';

export default async (
  symbol: string,
  rpcEndpoint: string = 'https://api.mainnet-beta.solana.com',
  environment?: string
) => {
  const connection = new Connection(rpcEndpoint, {
    commitment: 'finalized',
  });

  const reservePublickKey = new PublicKey(getReserveInfo(symbol, environment).address);
  const reserveAccountInfo = await connection.getAccountInfo(
    reservePublickKey,
  );

  if (!reserveAccountInfo) {
    throw Error(`Account for ${symbol} not found.`);
  }

  return parseReserve(reservePublickKey, reserveAccountInfo);
}

export const calculateUtilizationRatio = (reserve: Reserve) => {
  const borrowedAmount = reserve.liquidity.borrowedAmountWads
    .div(WAD);
  const availableAmount = new BN(reserve.liquidity.availableAmount);
  const currentUtilization =
    borrowedAmount.div(availableAmount.add(borrowedAmount));
  return currentUtilization;
};

export const calculateBorrowAPY = (reserve: Reserve) => {
  const currentUtilization = calculateUtilizationRatio(reserve);
  const optimalUtilization = reserve.config.optimalUtilizationRate / 100;

  let borrowAPY;
  if (optimalUtilization === 1.0 || currentUtilization < optimalUtilization) {
    const normalizedFactor = currentUtilization / optimalUtilization;
    const optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
    const minBorrowRate = reserve.config.minBorrowRate / 100;
    borrowAPY =
      normalizedFactor * (optimalBorrowRate - minBorrowRate) + minBorrowRate;
  } else {
    const normalizedFactor =
      (currentUtilization - optimalUtilization) / (1 - optimalUtilization);
    const optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
    const maxBorrowRate = reserve.config.maxBorrowRate / 100;
    borrowAPY =
      normalizedFactor * (maxBorrowRate - optimalBorrowRate) +
      optimalBorrowRate;
  }

  return borrowAPY;
};

export const calculateSupplyAPY = (reserve: Reserve) => {
  const currentUtilization = calculateUtilizationRatio(reserve);

  const borrowAPY = calculateBorrowAPY(reserve);
  return currentUtilization * borrowAPY;
};
