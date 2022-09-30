import { Connection, PublicKey } from "@solana/web3.js";
import axios from "axios";
import { SolendClaim } from "./claim";
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
import { ExternalRewardStatType, ConfigType } from "./shared";
import { estimateCurrentScore } from "./utils";
import { getProgramId } from "./constants";

const API_ENDPOINT = "https://api.solend.fi";

export type ClaimType = {
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

export type SolendReward = {
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

  programId: PublicKey;

  private constructor(
    wallet: anchor.Wallet,
    connection: Connection,
    environment: string
  ) {
    this.config = null;
    this.rewards = {};
    this.provider = new anchor.AnchorProvider(connection, wallet, {});
    this.programId = getProgramId(environment);
  }

  static async initialize(
    wallet: anchor.Wallet,
    connection: Connection,
    environment: "production" | "devnet" = "production"
  ) {
    const loadedWallet = new SolendWallet(wallet, connection, environment);
    const config = (await (
      await axios.get(
        `${API_ENDPOINT}/v1/markets/configs?scope=all&deployment=${environment}`
      )
    ).data) as ConfigType;
    loadedWallet.config = config;

    await loadedWallet.loadRewards();

    return loadedWallet;
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

    const psyOptionsProgram = new anchor.Program(
      PsyAmericanIdl,
      new PublicKey("R2y9ip6mxmWUj4pt54jP2hz2dgvMozy9VTSwMWE7evs"),
      this.provider
    ) as any;

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

    const primaryMarketSeed = this.config
      .find((market) => market.isPrimary)!
      .address.slice(0, 32);

    const obligationAddress = await PublicKey.createWithSeed(
      this.provider.wallet.publicKey,
      primaryMarketSeed,
      new PublicKey(this.programId)
    );

    const claimResponse = (
      await axios.get(
        `${API_ENDPOINT}/liquidity-mining/reward-proofs?obligation=${obligationAddress}`
      )
    ).data as Promise<Array<ClaimType>>;

    const [externalStatData, externalScoreData, claimData] = await Promise.all([
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

    const rewards = fullData.reduce((acc, currentValue) => {
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

        return {
          ...acc,
          [rewardScore.rewardMint]: {
            symbol: rewardScore.rewardSymbol,
            lifetimeAmount:
              (acc[rewardScore.rewardMint]?.lifetimeAmount ?? 0) +
              Number(currentScore),
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

    const rewardsData = {
      ...externalEarningsData,
    };

    const rewardMetadata = (
      await (
        await axios.get(
          `${API_ENDPOINT}/tokens/?symbols=${Object.values(rewardsData)
            .map((rew) => rew.symbol)
            .join(",")}`
        )
      ).data
    ).results as Array<{
      coingeckoID: string;
      decimals: number;
      logo: string;
      mint: string;
      name: string;
      symbol: string;
    }>;

    this.rewards = Object.fromEntries(
      Object.entries(rewardsData).map(([rewardMint, earning]) => {
        const rewardData = rewards[rewardMint];
        const rewardClaims = fullData
          .filter((lot) => lot.mintAddress.toBase58() === rewardMint)
          .map((reward) => new SolendClaim(reward, this.provider));
        const metadata = rewardMetadata.find(
          (rew) => rew?.symbol === earning.symbol
        );

        return [
          rewardMint,
          {
            ...earning,
            ...metadata,
            lifetimeAmount:
              earning.lifetimeAmount / 10 ** (36 - (metadata?.decimals ?? 0)),
            claimedAmount:
              rewardData
                ?.filter((reward) => reward.claimedAt)
                .reduce((acc, reward) => acc + Number(reward.quantity), 0) ?? 0,
            claimableAmount:
              rewardData
                ?.filter((reward) => !reward.claimedAt && reward.claimable)
                .reduce((acc, reward) => acc + Number(reward.quantity), 0) ?? 0,
            rewardClaims: rewardClaims,
          },
        ];
      })
    );
  }

  async getClaimAllIxs() {
    const allSetupIxs = [];
    const allClaimIxs = [];
    for (const claim of Object.values(this.rewards).flatMap(
      (reward) => reward.rewardClaims
    )) {
      const [setupIxs, claimIxs] = await claim.getClaimIxs();
      allSetupIxs.push(...setupIxs);
      allClaimIxs.push(...claimIxs);
    }

    return [allSetupIxs, allClaimIxs];
  }
}
