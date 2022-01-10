import { Connection, PublicKey } from "@solana/web3.js";
import { parsePriceData } from "@pythnetwork/client";
import { BNumber, getReserveInfo, getTokenInfo } from "./common";
import { parseReserve, Reserve } from "../state/reserve";

const SOLEND_API_HOST = "https://api.solend.fi";

type RewardPoolStat = {
  rewardsPerShare: string;
  totalBalance: string;
  lastSlot: number;
  side: string;
  tokenMint: string;
  rewardRates: Array<{
    beginningSlot: number;
    rewardRate: string;
  }>;
};

type RewardPoolResponse = {
  [mint: string]: {
    borrow: RewardPoolStat;
    supply: RewardPoolStat;
  };
};

const loadReserve = async (
  symbol: string,
  rpcEndpoint: string = "https://api.mainnet-beta.solana.com"
) => {
  const connection = new Connection(rpcEndpoint, {
    commitment: "finalized",
  });

  const reservePublickKey = new PublicKey(getReserveInfo(symbol).address);
  const reserveAccountInfo = await connection.getAccountInfo(reservePublickKey);

  if (!reserveAccountInfo) {
    throw Error(`Account for ${symbol} not found.`);
  }

  const parsedReserve = parseReserve(reservePublickKey, reserveAccountInfo);

  if (!parsedReserve) {
    throw Error("Could not parse reserve.");
  }

  return parsedReserve.info;
};

export const calculateUtilizationRatio = (reserve: Reserve) => {
  const borrowedAmount = new BNumber(
    reserve.liquidity.borrowedAmountWads.toString()
  ).fromWads();
  const availableAmount = new BNumber(
    reserve.liquidity.availableAmount.toString()
  );
  const currentUtilization = borrowedAmount.divideBy(
    availableAmount.add(borrowedAmount)
  );
  return currentUtilization;
};

export const calculateBorrowAPY = (reserve: Reserve) => {
  const currentUtilization = calculateUtilizationRatio(reserve);
  const optimalUtilization = new BNumber(
    reserve.config.optimalUtilizationRate.toString()
  ).divideBy(new BNumber(100));
  const optimalBorrowRate = new BNumber(
    reserve.config.optimalBorrowRate
  ).divideBy(new BNumber(100));

  let borrowAPY;
  if (
    optimalUtilization.isEqualTo(new BNumber(1)) ||
    currentUtilization.isLessThan(optimalUtilization)
  ) {
    const normalizedFactor = currentUtilization.divideBy(optimalUtilization);
    const minBorrowRate = new BNumber(reserve.config.minBorrowRate).divideBy(
      new BNumber(100)
    );
    borrowAPY = normalizedFactor
      .multiply(optimalBorrowRate.subtract(minBorrowRate))
      .add(minBorrowRate);
  } else {
    const normalizedFactor = currentUtilization
      .subtract(optimalUtilization)
      .divideBy(new BNumber(1).subtract(optimalUtilization));
    const maxBorrowRate = new BNumber(reserve.config.maxBorrowRate).divideBy(
      new BNumber(100)
    );
    borrowAPY = normalizedFactor
      .multiply(maxBorrowRate.subtract(optimalBorrowRate))
      .add(optimalBorrowRate);
  }

  return borrowAPY;
};

export async function loadTokensOracleData(
  priceAddresses: Array<string>,
  rpcEndpoint: string = "https://api.mainnet-beta.solana.com"
): Promise<Array<number>> {
  const addressesKeys = priceAddresses.map((add) => new PublicKey(add));

  const connection = new Connection(rpcEndpoint, {
    commitment: "finalized",
  });

  const unparsedOracleAccounts = await connection.getMultipleAccountsInfo(
    addressesKeys,
    "processed"
  );

  return unparsedOracleAccounts.map((acc) => {
    if (!acc) throw Error(`Unable to fetch prices from oracle.`);
    const priceData = parsePriceData(acc.data);
    if (!priceData?.price) throw Error(`Unable to fetch prices from oracle.`);
    return priceData.price;
  });
}

export const calculateSupplyAPY = (reserve: Reserve) => {
  const currentUtilization = calculateUtilizationRatio(reserve);

  const borrowAPY = calculateBorrowAPY(reserve);
  return currentUtilization.multiply(borrowAPY);
};

function getApyFromRewardRate(
  rewardRate: string,
  poolSize: string,
  price: number
) {
  return new BNumber(rewardRate)
    .multiply(new BNumber(price))
    .divideBy(new BNumber(poolSize))
    .fromWangs();
}

function getLatestRewardRate(
  rewardRates: Array<{
    beginningSlot: number;
    rewardRate: string;
    name?: string;
  }>,
  slot: number
) {
  return rewardRates
    .filter((rr) => slot >= rr.beginningSlot)
    .reduce((v1, v2) => (v1.beginningSlot > v2.beginningSlot ? v1 : v2), {
      beginningSlot: 0,
      rewardRate: "0",
    });
}

async function loadReward() {
  return (await (
    await fetch(`${SOLEND_API_HOST}/liquidity-mining/reward-stats`)
  ).json()) as RewardPoolResponse;
}

async function loadExternalReward() {
  return (await (
    await fetch(`${SOLEND_API_HOST}/liquidity-mining/external-reward-stats`)
  ).json()) as RewardPoolResponse;
}

export const calculateRewardApy = (
  mintAddress: string,
  price: number,
  side: "borrow" | "supply",
  slot: number,
  poolAssetPrice: BNumber,
  poolAssetDecimals: number,
  data: RewardPoolResponse
) => {
  const poolStat = data[mintAddress][side];
  const rewardRate = getLatestRewardRate(poolStat.rewardRates, slot);

  return getApyFromRewardRate(
    rewardRate.rewardRate,
    new BNumber(poolStat.totalBalance, poolAssetDecimals)
      .multiply(poolAssetPrice)
      .toHuman(),
    price
  );
};

export const calculateMarinadeData = async (
  rpcEndpoint: string = "https://api.mainnet-beta.solana.com"
) => {
  const connection = new Connection(rpcEndpoint, {
    commitment: "finalized",
  });

  const priceResponse = (await (
    await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solend,marinade&vs_currencies=usd"
    )
  ).json()) as any;

  const reserveInfo = getReserveInfo("mSOL");
  const solendPrice = priceResponse.solend.usd;
  const marinadePrice = priceResponse.marinade.usd;

  const mostRecentSlot = await connection.getSlot("finalized");
  const mintAddress = getTokenInfo("mSOL").mintAddress;

  const [reserve, reward, externalReward] = await Promise.all([
    loadReserve("mSOL"),
    loadReward(),
    loadExternalReward(),
  ]);

  const mSOLPrice = new BNumber(reserve.liquidity.marketPrice.toString(), 18);

  const rewardApy = calculateRewardApy(
    mintAddress,
    solendPrice,
    "supply",
    mostRecentSlot,
    mSOLPrice,
    reserveInfo.decimals,
    reward
  );
  const externalApy = calculateRewardApy(
    mintAddress,
    marinadePrice,
    "supply",
    mostRecentSlot,
    mSOLPrice,
    reserveInfo.decimals,
    externalReward
  );

  const apy = calculateSupplyAPY(reserve);

  return {
    tvl: new BNumber(
      reserve.liquidity.availableAmount.toString(),
      reserveInfo.decimals
    )
      .add(
        new BNumber(
          reserve.liquidity.borrowedAmountWads.toString(),
          18 + reserveInfo.decimals
        )
      )
      .multiply(mSOLPrice)
      .toHuman(),
    totalApy: apy.add(rewardApy).add(externalApy).toHuman(),
    dailySlndEmission: new BNumber(
      getLatestRewardRate(
        reward[mintAddress].supply.rewardRates,
        mostRecentSlot
      ).rewardRate
    )
      .divideBy(new BNumber(365))
      .fromWangs()
      .toHuman(),
    dailyMndeEmission: new BNumber(
      getLatestRewardRate(
        externalReward[mintAddress].supply.rewardRates,
        mostRecentSlot
      ).rewardRate
    )
      .divideBy(new BNumber(365))
      .fromWangs()
      .toHuman(),
  };
};

export default loadReserve;
