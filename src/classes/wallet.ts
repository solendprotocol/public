import { Connection, PublicKey } from "@solana/web3.js";
import axios from "axios";
import { SolendClaim } from "./claim";
import { ConfigType } from "./types";
import * as anchor from "@project-serum/anchor";
import {
  Token,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  AccountLayout,
  u64,
} from "@solana/spl-token";
import {
  PsyAmericanIdl,
  getOptionByKey,
  OptionMarketWithKey,
} from "@mithraic-labs/psy-american";
import {
  MERKLE_PROGRAM_ID,
  MerkleDistributorJSON,
} from "../utils/merkle_distributor";
import { estimateCurrentScore } from "./utils";

const API_ENDPOINT = "https://api.solend.fi";

type ClaimType = {
  obligationID: string;
  lotNumber: number;
  index: number;
  quantity: string;
  root: string;
  proof: Array<string>;
  distributorPublicKey: string;
  name: string;
  incentivizer: string;
  optionMarketKey: string;
};

export type EnrichedClaimType = {
  claimable: boolean;
  claimedAt: number | null;
  mintAddress: string;
  quantity: string;
  distributor: {
    mint: PublicKey;
    bump: number;
  };
  distributorATAPublicKey: PublicKey;
  claimId: PublicKey;
  claimStatusBump: number;
  optionMarket:
    | (OptionMarketWithKey & {
        userBalance: number;
      })
    | null;
} & ClaimType;

type RewardStatType = {
  rewardsPerShare: string;
  totalBalance: string;
  lastSlot: number;
  side: "supply" | "borrow";
  rewardRates: Array<{
    beginningSlot: number;
    rewardRate: string;
    name?: string;
  }>;
};

type ExternalRewardStatType = RewardStatType & {
  tokenMint: string;
  reserveID: string;
  market: string;
  mint: string;
  rewardMint: string;
  rewardSymbol: string;
};

type RewardScoreType = {
  obligationId: string;
  balance: string;
  debt: string;
  score: string;
  lastSlot: number;
  tokenMint: string;
  side: "supply" | "borrow";
};

type ExternalRewardScoreType = RewardScoreType & {
  reserveID: string;
  rewardMint: string;
  rewardSymbol: string;
};

type SolendReward = {
  lifetimeAmount: number;
  symbol: string;
  claimedAmount: number;
  claimableAmount: number;
  rewardClaims: Array<SolendClaim>;
};

export class SolendWallet {
  config: ConfigType | null;
  rewards: { [key: string]: SolendReward };
  provider: anchor.AnchorProvider;

  private constructor(wallet: anchor.Wallet, connection: Connection) {
    this.config = null;
    this.rewards = {};
    this.provider = new anchor.AnchorProvider(connection, wallet, {});
  }

  static async initialize(
    wallet: anchor.Wallet,
    connection: Connection,
    environment: "production" | "devnet" = "production"
  ) {
    const market = new SolendWallet(wallet, connection);
    const config = (await (
      await axios.get(`${API_ENDPOINT}/v1/config?deployment=${environment}`)
    ).data) as ConfigType;
    market.config = config;

    await market.loadRewards();

    return market;
  }

  async loadRewards() {
    if (!this.config) {
      throw Error("Wallet must be initialized to call loadRewards.");
    }
    const anchorProgram = new anchor.Program(
      MerkleDistributorJSON,
      new PublicKey(MERKLE_PROGRAM_ID),
      this.provider
    );

    console.log(this.provider);
    const psyOptionsProgram = new anchor.Program(
      PsyAmericanIdl,
      new PublicKey("R2y9ip6mxmWUj4pt54jP2hz2dgvMozy9VTSwMWE7evs"),
      this.provider
    ) as any;

    const lmStatResponse = (
      await axios.get(`${API_ENDPOINT}/liquidity-mining/reward-stats-v2`)
    ).data as Promise<{
      [poolKey: string]: {
        [keys: string]: {
          supply: RewardStatType;
          borrow: RewardStatType;
        };
      };
    }>;

    const lmScoreResponse = (
      await axios.get(
        `${API_ENDPOINT}/liquidity-mining/reward-score-v2?wallet=${this.provider.wallet.publicKey.toBase58()}`
      )
    ).data as Promise<{ [poolKey: string]: Array<RewardScoreType> }>;

    const externalStatResponse = (
      await axios.get(
        `${API_ENDPOINT}/liquidity-mining/external-reward-stats-v2?flat=true`
      )
    ).data as Promise<Array<ExternalRewardStatType>>;

    const externalScoreResponse = (
      await axios.get(
        `${API_ENDPOINT}/liquidity-mining/external-reward-score-v2?wallet=${this.provider.wallet.publicKey.toBase58()}`
      )
    ).data as Promise<Array<ExternalRewardScoreType>>;

    const primaryMarketSeed = this.config.markets
      .find((market) => market.isPrimary)!
      .address.slice(0, 32);

    const obligationAddress = await PublicKey.createWithSeed(
      this.provider.wallet.publicKey,
      primaryMarketSeed,
      new PublicKey(this.config.programID)
    );

    const claimResponse = (
      await axios.get(
        `${API_ENDPOINT}/liquidity-mining/reward-proofs?obligation=${obligationAddress}`
      )
    ).data as Promise<Array<ClaimType>>;

    const [
      lmStatData,
      lmScoreData,
      externalStatData,
      externalScoreData,
      claimData,
    ] = await Promise.all([
      lmStatResponse,
      lmScoreResponse,
      externalStatResponse,
      externalScoreResponse,
      claimResponse,
    ]);

    const optionMarkets = await Promise.all(
      claimData.map((d) =>
        d.optionMarketKey
          ? getOptionByKey(psyOptionsProgram, new PublicKey(d.optionMarketKey))
          : Promise.resolve(null)
      )
    );

    const optionAtas = await Promise.all(
      optionMarkets.map((om) =>
        om
          ? Token.getAssociatedTokenAddress(
              ASSOCIATED_TOKEN_PROGRAM_ID,
              TOKEN_PROGRAM_ID,
              new PublicKey(om.optionMint),
              this.provider.wallet.publicKey,
              true
            )
          : Promise.resolve(
              new PublicKey("nu11111111111111111111111111111111111111111")
            )
      )
    );

    const optionBalances =
      await this.provider.connection.getMultipleAccountsInfo(optionAtas);

    const parsedOptionBalances = optionBalances.map((om) =>
      om ? AccountLayout.decode(om.data) : null
    );

    const merkleDistributors =
      (await anchorProgram.account.merkleDistributor.fetchMultiple(
        claimData.map((d) => d.distributorPublicKey)
      )) as Array<any>;

    const claimAndBumps = await Promise.all(
      claimData.map(async (d) => {
        const claimAndBump = await PublicKey.findProgramAddress(
          [
            anchor.utils.bytes.utf8.encode("ClaimStatus"),
            new anchor.BN(d.index).toArrayLike(Buffer, "le", 8),
            new PublicKey(d.distributorPublicKey).toBytes(),
          ],
          new PublicKey(MERKLE_PROGRAM_ID)
        );

        return claimAndBump;
      })
    );

    const claimStatuses =
      (await anchorProgram.account.claimStatus.fetchMultiple(
        claimAndBumps.map((candb) => candb[0])
      )) as Array<any>;

    const fullData = await Promise.all(
      claimData.map(async (d, index) => {
        const [distributorATAPublicKey, _bump] =
          await PublicKey.findProgramAddress(
            [
              new PublicKey(d.distributorPublicKey).toBuffer(),
              TOKEN_PROGRAM_ID.toBuffer(),
              merkleDistributors[index].mint.toBuffer(),
            ],
            ASSOCIATED_TOKEN_PROGRAM_ID
          );

        const claimable =
          (
            await this.provider.connection.getTokenAccountBalance(
              distributorATAPublicKey
            )
          ).value.amount !== "0";

        const om = optionMarkets[index];

        return {
          ...d,
          optionMarket: om
            ? {
                ...om,
                userBalance: parsedOptionBalances[index]?.amount
                  ? u64
                      .fromBuffer(parsedOptionBalances[index]?.amount)
                      .toNumber()
                  : 0,
                expired:
                  om.expirationUnixTimestamp.toNumber() <=
                  Math.floor(new Date().getTime()) / 1000,
              }
            : null,
          claimable,
          claimedAt: claimStatuses[index]?.claimedAt,
          mintAddress: merkleDistributors[index].mint,
          distributor: merkleDistributors[index],
          distributorATAPublicKey,
          claimId: claimAndBumps[index][0],
          claimStatusBump: claimAndBumps[index][1],
        };
      })
    );

    const mostRecentSlot = await this.provider.connection.getSlot("finalized");
    const mostRecentSlotTime = (await this.provider.connection.getBlockTime(
      mostRecentSlot
    )) as number;

    const rewards = fullData
      .filter((d) => !["slnd_options", "slnd"].includes(d.incentivizer))
      .reduce((acc, currentValue) => {
        if (!acc[currentValue.distributor.mint]) {
          acc[currentValue.distributor.mint] = [];
        }
        acc[currentValue.distributor.mint].push(currentValue);
        return acc;
      }, {} as { [mint: string]: Array<EnrichedClaimType> });

    const externalEarningsData = externalScoreData.reduce(
      (acc, rewardScore) => {
        const rewardStat = externalStatData.find(
          (reward) =>
            reward.reserveID === rewardScore.reserveID &&
            reward.side === rewardScore.side
        );
        const currentScore = rewardStat
          ? estimateCurrentScore(
              rewardStat,
              rewardScore,
              mostRecentSlot,
              mostRecentSlotTime
            ).toNumber()
          : 0;

          console.log(acc, rewardScore);

        return {
          ...acc,
          [rewardScore.rewardMint]: {
            symbol: rewardScore.rewardSymbol,
            lifetimeAmount:
              (acc[rewardScore.rewardMint]?.lifetimeAmount ?? 0) + Number(currentScore)/10**36,
          },
        };
      },
      {} as {
        [key: string]: {
          symbol: string;
          lifetimeAmount: number;
        };
      }
    );

    const slndEarningsData = Object.entries(lmScoreData).reduce(
      (acc, [poolKey, pool]) => {
        const sum = pool.reduce((acc, rewardScore) => {
          if (
            !lmStatData[poolKey] ||
            !lmStatData[poolKey][rewardScore.tokenMint] ||
            !lmStatData[poolKey][rewardScore.tokenMint][rewardScore.side]
          )
            return acc;

          const rewardStat =
            lmStatData[poolKey][rewardScore.tokenMint][rewardScore.side];

          const currentScore = rewardStat
            ? estimateCurrentScore(
                rewardStat,
                rewardScore,
                mostRecentSlot,
                mostRecentSlotTime
              ).toNumber()
            : 0;

          return acc + Number(currentScore);
        }, 0);

        return acc + sum;
      },
      0
    );

    const rewardsData = {
      ...externalEarningsData,
      SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp: {
        symbol: "SLND",
        lifetimeAmount: slndEarningsData,
      },
    };

    const rewardMetaData = (
      await( await axios.get(
          `${API_ENDPOINT}/tokens/?symbols=${Object.values(rewardsData).map(rew => rew.symbol).join(',')}`
        )
      ).data).results as Array<{
      coingeckoID : string,
      decimals: number,
      logo : string,
      mint: string,
      name: string,
      symbol: string;
    }>;

    this.rewards = Object.fromEntries(
      Object.entries(rewardsData).map(([rewardMint, earning]) => {
        const rewardData = rewards[rewardMint];
        const rewardClaims = fullData
          .filter((lot) =>  lot.mintAddress.toBase58() === rewardMint)
          .map((reward) => new SolendClaim(reward, this.provider));
        const metadata = rewardMetaData.find(rew => rew?.mint === rewardMint)

        return [
          rewardMint,
          {
            ...earning,
            ...metadata,
            lifetimeAmount: earning.lifetimeAmount  / (10**(36 - (metadata?.decimals ?? 0))),
            claimedAmount: rewardData
              ?.filter((reward) => reward.claimedAt)
              .reduce((acc, reward) => acc + Number(reward.quantity), 0) ?? 0,
            claimableAmount: rewardData
              ?.filter((reward) => !reward.claimedAt && reward.claimable)
              .reduce((acc, reward) => acc + Number(reward.quantity), 0) ?? 0,
            rewardClaims: rewardClaims,
          },
        ];
      })
    );
  }
}
