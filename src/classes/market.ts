/* eslint-disable max-classes-per-file */
import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import { ConfigType } from "./types";
import BigNumber from "bignumber.js";
import { parseReserve } from "../state/reserve";
import { Obligation, parseObligation } from "../state/obligation";
import BN from "bn.js";
import { WAD, WANG } from "./constants";
import axios from "axios";

export type RewardInfo = {
  rewardRate: string;
  rewardMint?: string;
  rewardSymbol: string;
  price: number;
};

export type RewardsData = {
  [key: string]: {
    supply: Array<RewardInfo>;
    borrow: Array<RewardInfo>;
  };
};

type RewardStatType = {
  rewardsPerShare: string;
  totalBalance: string;
  lastSlot: number;
  rewardRates: Array<{
    beginningSlot: number;
    rewardRate: string;
    name?: string;
  }>;
} | null;

type ExternalRewardStatType = RewardStatType & {
  rewardMint: string;
  rewardSymbol: string;
};
type RewardResponse = {
  supply: RewardStatType;
  borrow: RewardStatType;
};

type ExternalRewardResponse = {
  supply: ExternalRewardStatType;
  borrow: ExternalRewardStatType;
};

type FormattedMarketConfig = ReturnType<typeof formatReserveConfig>;

const API_ENDPOINT = "https://api.solend.fi";

function formatReserveConfig(config: ConfigType) {
  const mainMarket = config.markets.find((mar) => mar.name === "main");
  if (!mainMarket) {
    throw Error("Main market not found.");
  }
  const hydratedReserves = mainMarket.reserves.map((res) => {
    const assetData = config.assets.find((asset) => asset.symbol === res.asset);
    if (!assetData) {
      throw new Error(`Could not find asset ${res.asset} in config`);
    }

    const oracleData = config.oracles.assets.find(
      (asset) => asset.asset === res.asset
    );
    if (!oracleData) {
      throw new Error(`Could not find oracle data for ${res.asset} in config`);
    }
    const { asset: _asset, ...trimmedoracleData } = oracleData;

    return {
      ...res,
      ...assetData,
      ...trimmedoracleData,
    };
  });
  return {
    ...mainMarket,
    pythProgramID: config.oracles.pythProgramID,
    switchboardProgramID: config.oracles.switchboardProgramID,
    programID: config.programID,
    reserves: hydratedReserves,
  };
}

export class SolendMarket {
  reserves: Array<SolendReserve>;

  rewardsData: RewardsData | null;

  config: FormattedMarketConfig | null;

  private connection: Connection;

  private constructor(connection: Connection) {
    this.connection = connection;
    this.reserves = [];
    this.rewardsData = null;
    this.config = null;
  }

  static async initialize(
    connection: Connection,
    environment: "production" | "devnet" = "production"
  ) {
    const market = new SolendMarket(connection);
    const rawConfig = (await (
      await axios.get(`${API_ENDPOINT}/v1/config?deployment=${environment}`)
    ).data) as ConfigType;
    market.config = formatReserveConfig(rawConfig);
    market.reserves = market.config.reserves.map(
      (res) => new SolendReserve(res, market, connection)
    );

    return market;
  }

  async fetchObligationByWallet(publicKey: PublicKey) {
    const { config, reserves } = this;
    if (!config) {
      throw Error(
        "Market must be initialized to call fetchObligationByWallet."
      );
    }
    const obligationAddress = await PublicKey.createWithSeed(
      publicKey,
      config.address.slice(0, 32),
      new PublicKey(config?.programID)
    );
    const rawObligationData = await this.connection.getAccountInfo(
      obligationAddress
    );

    if (!rawObligationData) {
      return null;
    }

    const parsedObligation = parseObligation(
      PublicKey.default,
      rawObligationData!
    );

    if (!parsedObligation) {
      throw Error("Could not parse obligation.");
    }

    if (!reserves.every((reserve) => reserve.stats)) {
      await this.loadReserves();
    }

    const obligationInfo = parsedObligation.info;

    return new SolendObligation(
      publicKey,
      obligationAddress,
      obligationInfo,
      reserves
    );
  }

  async loadAll() {
    const promises = [this.loadReserves(), this.loadRewards()];

    await Promise.all(promises);
  }

  private async loadLMRewardData() {
    const data = (
      await axios.get(`${API_ENDPOINT}/liquidity-mining/reward-stats`)
    ).data as Promise<{
      [key: string]: RewardResponse;
    }>;

    return data;
  }

  private async loadExternalRewardData() {
    const data = (
      await axios.get(`${API_ENDPOINT}/liquidity-mining/external-reward-stats`)
    ).data as Promise<{
      [key: string]: ExternalRewardResponse;
    }>;

    return data;
  }

  private async loadPriceData(symbols: Array<string>) {
    const data = (await (
      await axios.get(`${API_ENDPOINT}/v1/prices/?symbols=${symbols.join(",")}`)
    ).data) as {
      results: Array<{
        identifier: string;
        price: string;
        source: string;
      }>;
    };

    return data.results.reduce(
      (acc, price) => ({
        ...acc,
        [price.identifier]: Number(price.price),
      }),
      {} as { [key: string]: number }
    );
  }

  private getLatestRewardRate(
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

  async loadRewards() {
    const promises = [
      this.loadLMRewardData(),
      this.loadExternalRewardData(),
      this.connection.getSlot("finalized"),
    ] as const;

    const [lmRewards, externalRewards, currentSlot] = await Promise.all(
      promises
    );

    const querySymbols = Object.values(externalRewards)
      .flatMap((reward) => [
        reward.supply?.rewardSymbol,
        reward.borrow?.rewardSymbol,
      ])
      .filter((x) => x);

    const priceData = await this.loadPriceData(querySymbols.concat("SLND"));

    this.rewardsData = this.reserves.reduce((acc, reserve) => {
      const {
        config: { mintAddress },
      } = reserve;
      const lmReward = lmRewards[mintAddress];
      const externalReward = externalRewards[mintAddress];

      const supply = [
        lmReward?.supply
          ? {
              rewardRate: this.getLatestRewardRate(
                lmReward.supply.rewardRates,
                currentSlot
              ).rewardRate,
              rewardMint: "SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp",
              rewardSymbol: "SLND",
              price: new BigNumber(priceData.SLND).toNumber(),
            }
          : null,
        externalReward?.supply
          ? {
              rewardRate: this.getLatestRewardRate(
                externalReward.supply.rewardRates,
                currentSlot
              ).rewardRate,
              rewardMint: externalReward.supply.rewardMint,
              rewardSymbol: externalReward.supply.rewardSymbol,
              price: priceData[externalReward.supply.rewardSymbol],
            }
          : null,
      ].filter((x) => x);

      const borrow = [
        lmReward?.borrow
          ? {
              rewardRate: this.getLatestRewardRate(
                lmReward.borrow.rewardRates,
                currentSlot
              ).rewardRate,
              rewardMint: "SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp",
              rewardSymbol: "SLND",
              price: new BigNumber(priceData.SLND).toNumber(),
            }
          : null,
        externalReward?.borrow
          ? {
              rewardRate: this.getLatestRewardRate(
                externalReward.borrow.rewardRates,
                currentSlot
              ).rewardRate,
              rewardMint: externalReward.borrow.rewardMint,
              rewardSymbol: externalReward.borrow.rewardSymbol,
              price: priceData[externalReward.borrow.rewardSymbol],
            }
          : null,
      ].filter((x) => x);

      return {
        ...acc,
        [reserve.config.mintAddress]: {
          supply,
          borrow,
        },
      };
    }, {});

    const refreshReserves = this.reserves.map((reserve) => {
      return reserve.load();
    });

    await Promise.all(refreshReserves);
  }

  async loadReserves() {
    const addresses = this.reserves.map(
      (reserve) => new PublicKey(reserve.config.address)
    );
    const reserveAccounts = await this.connection.getMultipleAccountsInfo(
      addresses,
      "processed"
    );

    const loadReserves = this.reserves.map((reserve, index) => {
      reserve.setBuffer(reserveAccounts[index]);
      return reserve.load();
    });

    await Promise.all(loadReserves);
  }

  async refreshAll() {
    const promises = [
      this.reserves.every((reserve) => reserve.stats)
        ? this.loadReserves()
        : null,
      this.rewardsData ? this.loadRewards() : null,
    ].filter((x) => x);

    await Promise.all(promises);
  }
}

export type ReserveData = {
  optimalUtilizationRate: number;
  loanToValueRatio: number;
  liquidationBonus: number;
  liquidationThreshold: number;
  minBorrowRate: number;
  optimalBorrowRate: number;
  maxBorrowRate: number;
  borrowFeePercentage: number;
  hostFeePercentage: number;
  depositLimit: BN;
  reserveBorrowLimit: BN;
  name: string;
  symbol: string;
  decimals: number;
  mintAddress: string;
  totalDepositsWads: BN;
  totalBorrowsWads: BN;
  totalLiquidityWads: BN;
  supplyInterestAPY: number;
  borrowInterestAPY: number;
  assetPriceUSD: number;
  userDepositLimit?: number;
  cumulativeBorrowRateWads: BN;
  cTokenExchangeRate: number;
};

type ParsedReserve = NonNullable<ReturnType<typeof parseReserve>>["info"];
type FormattedReserveConfig = FormattedMarketConfig["reserves"][0];

export class SolendReserve {
  config: FormattedReserveConfig;

  private market: SolendMarket;

  private buffer: AccountInfo<Buffer> | null;

  stats: ReserveData | null;

  private connection: Connection;

  constructor(
    reserveConfig: FormattedReserveConfig,
    market: SolendMarket,
    connection: Connection
  ) {
    this.config = reserveConfig;
    this.market = market;
    this.buffer = null;
    this.stats = null;
    this.connection = connection;
  }

  private calculateSupplyAPY(reserve: ParsedReserve) {
    const currentUtilization = this.calculateUtilizationRatio(reserve);

    const borrowAPY = this.calculateBorrowAPY(reserve);
    return currentUtilization * borrowAPY;
  }

  private calculateUtilizationRatio(reserve: ParsedReserve) {
    const totalBorrowsWads = new BigNumber(
      reserve.liquidity.borrowedAmountWads.toString()
    )
      .div(WAD)
      .toNumber();
    const currentUtilization =
      totalBorrowsWads /
      (reserve.liquidity.availableAmount.toNumber() + totalBorrowsWads);

    return currentUtilization;
  }

  private calculateBorrowAPY(reserve: ParsedReserve) {
    const currentUtilization = this.calculateUtilizationRatio(reserve);
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
  }

  setBuffer(buffer: AccountInfo<Buffer> | null) {
    this.buffer = buffer;
  }

  async load() {
    if (!this.buffer) {
      this.buffer = await this.connection.getAccountInfo(
        new PublicKey(this.config.address),
        "processed"
      );
    }

    if (!this.buffer) {
      throw Error(`Error requesting account info for ${this.config.name}`);
    }

    const parsedData = parseReserve(
      new PublicKey(this.config.address),
      this.buffer
    )?.info;
    if (!parsedData) {
      throw Error(`Unable to parse data of reserve ${this.config.name}`);
    }

    this.stats = await this.formatReserveData(parsedData);
  }

  calculateRewardAPY(
    rewardRate: string,
    poolSize: string,
    rewardPrice: number,
    tokenPrice: number,
    decimals: number
  ) {
    const poolValueUSD = new BigNumber(poolSize)
      .times(tokenPrice)
      .dividedBy("1".concat(Array(decimals + 1).join("0")))
      .dividedBy(WAD);

    return new BigNumber(rewardRate)
      .multipliedBy(rewardPrice)
      .dividedBy(poolValueUSD)
      .dividedBy(WANG);
  }

  totalSupplyAPY() {
    const { stats } = this;
    if (!this.market.rewardsData || !stats) {
      throw Error(
        "SolendMarket must be initialized with the withRewardData flag as true and load must be called on the reserve."
      );
    }

    const rewards = this.market.rewardsData[this.config.mintAddress].supply.map(
      (reward) => ({
        rewardMint: reward.rewardMint,
        rewardSymbol: reward.rewardSymbol,
        apy: this.calculateRewardAPY(
          reward.rewardRate,
          stats.totalDepositsWads.toString(),
          reward.price,
          stats.assetPriceUSD,
          this.config.decimals
        ).toNumber(),
        price: reward.price,
      })
    );
    const totalAPY = new BigNumber(stats.supplyInterestAPY)
      .plus(
        rewards.reduce((acc, reward) => acc.plus(reward.apy), new BigNumber(0))
      )
      .toNumber();

    return {
      interestAPY: stats.supplyInterestAPY,
      totalAPY,
      rewards,
    };
  }

  totalBorrowAPY() {
    const { stats } = this;
    if (!this.market.rewardsData || !stats) {
      throw Error(
        "SolendMarket must be initialized with the withRewardData flag as true and load must be called on the reserve."
      );
    }

    const rewards = this.market.rewardsData[this.config.mintAddress].borrow.map(
      (reward) => ({
        rewardMint: reward.rewardMint,
        rewardSymbol: reward.rewardSymbol,
        apy: this.calculateRewardAPY(
          reward.rewardRate,
          stats.totalBorrowsWads.toString(),
          reward.price,
          stats.assetPriceUSD,
          this.config.decimals
        ).toNumber(),
        price: reward.price,
      })
    );
    const totalAPY = new BigNumber(stats.borrowInterestAPY)
      .minus(
        rewards.reduce((acc, reward) => acc.plus(reward.apy), new BigNumber(0))
      )
      .toNumber();

    return {
      interestAPY: stats.borrowInterestAPY,
      totalAPY,
      rewards,
    };
  }

  private formatReserveData(
    parsedData: NonNullable<ReturnType<typeof parseReserve>>["info"]
  ): ReserveData {
    const totalBorrowsWads = parsedData.liquidity.borrowedAmountWads;
    const totalLiquidityWads = parsedData.liquidity.availableAmount.mul(
      new BN(WAD)
    );
    const totalDepositsWads = totalBorrowsWads.add(totalLiquidityWads);
    const cTokenExchangeRate = new BigNumber(totalDepositsWads.toString())
      .div(parsedData.collateral.mintTotalSupply.toString())
      .div(WAD)
      .toNumber();

    return {
      // Reserve config
      optimalUtilizationRate: parsedData.config.optimalUtilizationRate / 100,
      loanToValueRatio: parsedData.config.loanToValueRatio / 100,
      liquidationBonus: parsedData.config.liquidationBonus / 100,
      liquidationThreshold: parsedData.config.liquidationThreshold / 100,
      minBorrowRate: parsedData.config.minBorrowRate / 100,
      optimalBorrowRate: parsedData.config.optimalBorrowRate / 100,
      maxBorrowRate: parsedData.config.maxBorrowRate / 100,
      borrowFeePercentage: new BigNumber(
        parsedData.config.fees.borrowFeeWad.toString()
      )
        .dividedBy(WAD)
        .toNumber(),
      hostFeePercentage: parsedData.config.fees.hostFeePercentage / 100,
      depositLimit: parsedData.config.depositLimit,
      reserveBorrowLimit: parsedData.config.borrowLimit,

      // Reserve info
      name: this.config.name,
      symbol: this.config.symbol,
      decimals: this.config.decimals,
      mintAddress: this.config.mintAddress,
      totalDepositsWads,
      totalBorrowsWads,
      totalLiquidityWads,
      supplyInterestAPY: this.calculateSupplyAPY(parsedData),
      borrowInterestAPY: this.calculateBorrowAPY(parsedData),
      assetPriceUSD: new BigNumber(parsedData.liquidity.marketPrice.toString())
        .div(WAD)
        .toNumber(),
      userDepositLimit: this.config.userSupplyCap,
      cumulativeBorrowRateWads: parsedData.liquidity.cumulativeBorrowRateWads,
      cTokenExchangeRate,
    };
  }
}

export type Position = {
  mintAddress: string;
  amount: BN;
};

export type ObligationStats = {
  liquidationThreshold: number;
  userTotalDeposit: number;
  userTotalBorrow: number;
  borrowLimit: number;
  borrowUtilization: number;
  netAccountValue: number;
  positions: number;
};

export class SolendObligation {
  walletAddress: PublicKey;

  obligationAddress: PublicKey;

  deposits: Array<Position>;

  borrows: Array<Position>;

  obligationStats: ObligationStats;

  constructor(
    walletAddress: PublicKey,
    obligationAddress: PublicKey,
    obligation: Obligation,
    reserves: Array<SolendReserve>
  ) {
    this.walletAddress = walletAddress;
    this.obligationAddress = obligationAddress;

    const positionDetails = this.calculatePositions(obligation, reserves);

    this.deposits = positionDetails.deposits;
    this.borrows = positionDetails.borrows;
    this.obligationStats = positionDetails.stats;
  }

  private calculatePositions(
    obligation: Obligation,
    reserves: Array<SolendReserve>
  ) {
    let userTotalDeposit = new BigNumber(0);
    let borrowLimit = new BigNumber(0);
    let liquidationThreshold = new BigNumber(0);
    let positions = 0;

    const deposits = obligation.deposits.map((deposit) => {
      const reserve = reserves.find(
        (reserve) =>
          reserve.config.address === deposit.depositReserve.toBase58()
      );
      const loanToValue = reserve!.stats!.loanToValueRatio;
      const liqThreshold = reserve!.stats!.liquidationThreshold;

      const supplyAmount = new BN(
        Math.floor(
          new BigNumber(deposit.depositedAmount.toString())
            .multipliedBy(reserve!.stats!.cTokenExchangeRate)
            .toNumber()
        )
      );
      const supplyAmountUSD = new BigNumber(supplyAmount.toString())
        .multipliedBy(reserve!.stats!.assetPriceUSD)
        .dividedBy("1".concat(Array(reserve!.stats!.decimals + 1).join("0")));

      userTotalDeposit = userTotalDeposit.plus(supplyAmountUSD);

      borrowLimit = borrowLimit.plus(supplyAmountUSD.multipliedBy(loanToValue));

      liquidationThreshold = liquidationThreshold.plus(
        supplyAmountUSD.multipliedBy(liqThreshold)
      );

      if (!supplyAmount.eq(new BN("0"))) {
        positions += 1;
      }

      return {
        mintAddress: reserve!.config.mintAddress,
        amount: supplyAmount,
      };
    });

    let userTotalBorrow = new BigNumber(0);

    const borrows = obligation.borrows.map((borrow) => {
      const reserve = reserves.find(
        (reserve) => reserve.config.address === borrow.borrowReserve.toBase58()
      );

      const borrowAmount = new BN(
        Math.floor(
          new BigNumber(borrow.borrowedAmountWads.toString())
            .multipliedBy(reserve!.stats!.cumulativeBorrowRateWads.toString())
            .dividedBy(borrow.cumulativeBorrowRateWads.toString())
            .dividedBy(WAD)
            .toNumber()
        ).toString()
      );
      const borrowAmountUSD = new BigNumber(borrowAmount.toString())
        .multipliedBy(reserve!.stats!.assetPriceUSD)
        .dividedBy("1".concat(Array(reserve!.stats!.decimals + 1).join("0")));

      if (!borrowAmount.eq(new BN("0"))) {
        positions += 1;
      }

      userTotalBorrow = userTotalBorrow.plus(borrowAmountUSD);

      return {
        mintAddress: reserve!.config.mintAddress,
        amount: borrowAmount,
      };
    });

    return {
      deposits,
      borrows,
      stats: {
        liquidationThreshold: liquidationThreshold.toNumber(),
        userTotalDeposit: userTotalDeposit.toNumber(),
        userTotalBorrow: userTotalBorrow.toNumber(),
        borrowLimit: borrowLimit.toNumber(),
        borrowUtilization: userTotalBorrow.dividedBy(borrowLimit).toNumber(),
        netAccountValue: userTotalDeposit.minus(userTotalBorrow).toNumber(),
        positions,
      },
    };
  }
}
/* eslint-enable max-classes-per-file */
