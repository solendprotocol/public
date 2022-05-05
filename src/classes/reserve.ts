/* eslint-disable max-classes-per-file */
import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { parseReserve } from "../state/reserve";
import BN from "bn.js";
import { FormattedMarketConfig, RewardsData } from "./market";
import { WAD, WANG, SLOTS_PER_YEAR } from "./constants";

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

  private rewardsData: RewardsData | null;

  private buffer: AccountInfo<Buffer> | null;

  stats: ReserveData | null;

  private connection: Connection;

  constructor(reserveConfig: FormattedReserveConfig, connection: Connection) {
    this.config = reserveConfig;
    this.rewardsData = null;
    this.buffer = null;
    this.stats = null;
    this.connection = connection;
  }

  private calculateSupplyAPY = (reserve: ParsedReserve) => {
    const apr = this.calculateSupplyAPR(reserve);
    const apy =
      new BigNumber(1)
        .plus(new BigNumber(apr).dividedBy(SLOTS_PER_YEAR))
        .toNumber() **
        SLOTS_PER_YEAR -
      1;
    return apy;
  };

  private calculateBorrowAPY = (reserve: ParsedReserve) => {
    const apr = this.calculateBorrowAPR(reserve);
    const apy =
      new BigNumber(1)
        .plus(new BigNumber(apr).dividedBy(SLOTS_PER_YEAR))
        .toNumber() **
        SLOTS_PER_YEAR -
      1;
    return apy;
  };

  private calculateSupplyAPR(reserve: ParsedReserve) {
    const currentUtilization = this.calculateUtilizationRatio(reserve);

    const borrowAPY = this.calculateBorrowAPR(reserve);
    return currentUtilization * borrowAPY;
  }

  private calculateUtilizationRatio(reserve: ParsedReserve) {
    const totalBorrowsWads = new BigNumber(
      reserve.liquidity.borrowedAmountWads.toString()
    ).div(WAD);
    const currentUtilization = totalBorrowsWads
      .dividedBy(
        totalBorrowsWads.plus(reserve.liquidity.availableAmount.toString())
      )
      .toNumber();

    return currentUtilization;
  }

  private calculateBorrowAPR(reserve: ParsedReserve) {
    const currentUtilization = this.calculateUtilizationRatio(reserve);
    const optimalUtilization = reserve.config.optimalUtilizationRate / 100;

    let borrowAPR;
    if (optimalUtilization === 1.0 || currentUtilization < optimalUtilization) {
      const normalizedFactor = currentUtilization / optimalUtilization;
      const optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
      const minBorrowRate = reserve.config.minBorrowRate / 100;
      borrowAPR =
        normalizedFactor * (optimalBorrowRate - minBorrowRate) + minBorrowRate;
    } else {
      const normalizedFactor =
        (currentUtilization - optimalUtilization) / (1 - optimalUtilization);
      const optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
      const maxBorrowRate = reserve.config.maxBorrowRate / 100;
      borrowAPR =
        normalizedFactor * (maxBorrowRate - optimalBorrowRate) +
        optimalBorrowRate;
    }

    return borrowAPR;
  }

  setBuffer(buffer: AccountInfo<Buffer> | null) {
    this.buffer = buffer;
  }

  async load(rewardsData?: RewardsData) {
    if (rewardsData) {
      this.rewardsData = rewardsData;
    }
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
    if (!this.rewardsData || !stats) {
      throw Error("SolendMarket must call loadRewards.");
    }

    const rewards = this.rewardsData[this.config.mintAddress].supply.map(
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
    if (!this.rewardsData || !stats) {
      throw Error("SolendMarket must call loadRewards.");
    }

    const rewards = this.rewardsData[this.config.mintAddress].borrow.map(
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
