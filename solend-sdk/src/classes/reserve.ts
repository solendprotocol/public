/* eslint-disable max-classes-per-file */
import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { parseReserve } from "../state/reserve";
import BN from "bn.js";
import { WAD, WANG } from "./constants";
import { ReserveConfigType, RewardsDataType, ReserveDataType } from "./shared";
import { calculateBorrowInterest, calculateSupplyInterest } from "../core";

type ParsedReserve = NonNullable<ReturnType<typeof parseReserve>>["info"];

export class SolendReserve {
  config: ReserveConfigType;

  private rewardsData: RewardsDataType | null;

  private buffer: AccountInfo<Buffer> | null;

  stats: ReserveDataType | null;

  private connection: Connection;

  constructor(reserveConfig: ReserveConfigType, connection: Connection) {
    this.config = reserveConfig;
    this.rewardsData = null;
    this.buffer = null;
    this.stats = null;
    this.connection = connection;
  }

  private calculateSupplyAPY = (reserve: ParsedReserve) => {
    return calculateSupplyInterest(reserve, true).toNumber();
  };

  private calculateBorrowAPY = (reserve: ParsedReserve) => {
    return calculateBorrowInterest(reserve, true).toNumber();
  };

  private calculateSupplyAPR(reserve: ParsedReserve) {
    return calculateSupplyInterest(reserve, false).toNumber();
  }

  private calculateBorrowAPR(reserve: ParsedReserve) {
    return calculateBorrowInterest(reserve, false).toNumber();
  }

  setBuffer(buffer: AccountInfo<Buffer> | null) {
    this.buffer = buffer;
  }

  async load(rewardsData?: RewardsDataType) {
    if (rewardsData) {
      this.rewardsData = rewardsData;
    }
    if (!this.buffer) {
      this.buffer = await this.connection.getAccountInfo(
        new PublicKey(this.config.address),
        "processed",
      );
    }

    if (!this.buffer) {
      throw Error(
        `Error requesting account info for ${this.config.liquidityToken.name}`,
      );
    }

    const parsedData = parseReserve(
      new PublicKey(this.config.address),
      this.buffer,
    )?.info;
    if (!parsedData) {
      throw Error(
        `Unable to parse data of reserve ${this.config.liquidityToken.name}`,
      );
    }

    this.stats = this.formatReserveData(parsedData);
  }

  calculateRewardAPY(
    rewardRate: string,
    poolSize: string,
    rewardPrice: number,
    tokenPrice: number,
    decimals: number,
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

    const rewards = this.rewardsData[
      this.config.liquidityToken.mint
    ].supply.map((reward) => ({
      rewardMint: reward.rewardMint,
      rewardSymbol: reward.rewardSymbol,
      apy: this.calculateRewardAPY(
        reward.rewardRate,
        stats.totalDepositsWads.toString(),
        reward.price,
        stats.assetPriceUSD,
        this.config.liquidityToken.decimals,
      ).toNumber(),
      price: reward.price,
    }));

    const totalAPY = new BigNumber(stats.supplyInterestAPY)
      .plus(
        rewards.reduce((acc, reward) => acc.plus(reward.apy), new BigNumber(0)),
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

    const rewards = this.rewardsData[
      this.config.liquidityToken.mint
    ].borrow.map((reward) => ({
      rewardMint: reward.rewardMint,
      rewardSymbol: reward.rewardSymbol,
      apy: this.calculateRewardAPY(
        reward.rewardRate,
        stats.totalBorrowsWads.toString(),
        reward.price,
        stats.assetPriceUSD,
        this.config.liquidityToken.decimals,
      ).toNumber(),
      price: reward.price,
    }));

    const totalAPY = new BigNumber(stats.borrowInterestAPY)
      .minus(
        rewards.reduce((acc, reward) => acc.plus(reward.apy), new BigNumber(0)),
      )
      .toNumber();

    return {
      interestAPY: stats.borrowInterestAPY,
      totalAPY,
      rewards,
    };
  }

  private formatReserveData(
    parsedData: NonNullable<ReturnType<typeof parseReserve>>["info"],
  ): ReserveDataType {
    const totalBorrowsWads = parsedData.liquidity.borrowedAmountWads;
    const totalLiquidityWads = parsedData.liquidity.availableAmount.mul(
      new BN(WAD),
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
      protocolTakeRate: parsedData.config.protocolTakeRate / 100,
      borrowFeePercentage: new BigNumber(
        parsedData.config.fees.borrowFeeWad.toString(),
      )
        .dividedBy(WAD)
        .toNumber(),
      hostFeePercentage: parsedData.config.fees.hostFeePercentage / 100,
      flashLoanFeePercentage: new BigNumber(
        parsedData.config.fees.flashLoanFeeWad.toString(),
      )
        .dividedBy(WAD)
        .toNumber(),

      depositLimit: parsedData.config.depositLimit,
      reserveBorrowLimit: parsedData.config.borrowLimit,

      // Reserve info
      name: this.config.liquidityToken.name,
      symbol: this.config.liquidityToken.symbol,
      decimals: this.config.liquidityToken.decimals,
      mintAddress: this.config.liquidityToken.mint,
      totalDepositsWads,
      totalBorrowsWads,
      totalLiquidityWads,
      supplyInterestAPY: this.calculateSupplyAPY(parsedData),
      borrowInterestAPY: this.calculateBorrowAPY(parsedData),
      supplyInterestAPR: this.calculateSupplyAPR(parsedData),
      borrowInterestAPR: this.calculateBorrowAPR(parsedData),
      assetPriceUSD: new BigNumber(parsedData.liquidity.marketPrice.toString())
        .div(WAD)
        .toNumber(),
      userDepositLimit: this.config.userSupplyCap,
      cumulativeBorrowRateWads: parsedData.liquidity.cumulativeBorrowRateWads,
      cTokenExchangeRate,
    };
  }
}
