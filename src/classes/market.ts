import { Connection, PublicKey } from "@solana/web3.js";
import { ConfigType } from "./types";
import BigNumber from "bignumber.js";
import { SolendObligation } from "./obligation";
import { SolendReserve } from "./reserve";
import { parseObligation } from "../state/obligation";
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

export type RewardStatType = {
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
  reserveID: string;
  side: "supply" | "borrow";
};

export type RewardResponse = {
  supply: RewardStatType;
  borrow: RewardStatType;
};

export type FormattedMarketConfig = ReturnType<typeof formatReserveConfig>;

const API_ENDPOINT = "https://api.solend.fi";

export function formatReserveConfig(
  config: ConfigType,
  marketAddress?: string
) {
  const market = marketAddress
    ? config.markets.find((mar) => mar.address === marketAddress)
    : config.markets.find((mar) => mar.isPrimary) ?? config.markets[0];
  if (!market) {
    throw Error("No markets found.");
  }
  const hydratedReserves = market.reserves.map((res) => {
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
    ...market,
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
    environment: "production" | "devnet" = "production",
    marketAddress?: string
  ) {
    const market = new SolendMarket(connection);
    const rawConfig = (await (
      await axios.get(`${API_ENDPOINT}/v1/config?deployment=${environment}`)
    ).data) as ConfigType;
    market.config = formatReserveConfig(rawConfig, marketAddress);
    market.reserves = market.config.reserves.map(
      (res) => new SolendReserve(res, connection)
    );

    return market;
  }

  async fetchObligationByWallet(publicKey: PublicKey) {
    const { config, reserves } = this;
    if (!config) {
      throw Error("Market must be initialized to call initialize.");
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
      await axios.get(`${API_ENDPOINT}/liquidity-mining/reward-stats-v2`)
    ).data as Promise<{
      [marketAddress: string]: {
        [mintAddress: string]: RewardResponse;
      };
    }>;

    return data;
  }

  private async loadExternalRewardData() {
    const data = (
      await axios.get(
        `${API_ENDPOINT}/liquidity-mining/external-reward-stats-v2?flat=true`
      )
    ).data as Promise<Array<ExternalRewardStatType>>;

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
    if (!this.config) {
      throw Error("Market must be initialized to call loadRewards.");
    }

    const promises = [
      this.loadLMRewardData(),
      this.loadExternalRewardData(),
      this.connection.getSlot("finalized"),
    ] as const;

    const [lmRewards, externalRewards, currentSlot] = await Promise.all(
      promises
    );

    const querySymbols = [
      ...new Set(externalRewards.map((reward) => reward.rewardSymbol)),
    ];

    const priceData = await this.loadPriceData(querySymbols.concat("SLND"));

    this.rewardsData = this.reserves.reduce((acc, reserve) => {
      const {
        config: { mintAddress },
      } = reserve;
      const lmReward = lmRewards[this.config!.address][mintAddress];

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
        ...externalRewards
          .filter(
            (externalReward) =>
              externalReward.reserveID === reserve.config.address &&
              externalReward.side === "supply"
          )
          .map((externalReward) => ({
            rewardRate: this.getLatestRewardRate(
              externalReward.rewardRates,
              currentSlot
            ).rewardRate,
            rewardMint: externalReward.rewardMint,
            rewardSymbol: externalReward.rewardSymbol,
            price: priceData[externalReward.rewardSymbol],
          })),
      ].filter(Boolean);

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
        ...externalRewards
          .filter(
            (externalReward) =>
              externalReward.reserveID === reserve.config.address &&
              externalReward.side === "borrow"
          )
          .map((externalReward) => ({
            rewardRate: this.getLatestRewardRate(
              externalReward.rewardRates,
              currentSlot
            ).rewardRate,
            rewardMint: externalReward.rewardMint,
            rewardSymbol: externalReward.rewardSymbol,
            price: priceData[externalReward.rewardSymbol],
          })),
      ].filter(Boolean);

      return {
        ...acc,
        [reserve.config.mintAddress]: {
          supply,
          borrow,
        },
      };
    }, {});

    const refreshReserves = this.reserves.map((reserve) => {
      return reserve.load(this.rewardsData ?? undefined);
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
