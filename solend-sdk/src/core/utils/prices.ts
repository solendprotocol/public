import { Connection, PublicKey } from "@solana/web3.js";
import { parsePriceData } from "@pythnetwork/client";
import SwitchboardProgram from "@switchboard-xyz/sbv2-lite";
import { Reserve } from "../../state";
import { getBatchMultipleAccountsInfo } from "./utils";

const SBV2_MAINNET = "SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f";

export async function fetchPrices(
  parsedReserves: Array<{ info: Reserve; pubkey: PublicKey }>,
  connection: Connection,
  switchboardProgram: SwitchboardProgram,
  debug?: boolean
) {
  if (debug) console.log("fetchPrices");
  const oracles = parsedReserves
    .map((reserve) => reserve.info.liquidity.pythOracle)
    .concat(
      parsedReserves.map((reserve) => reserve.info.liquidity.switchboardOracle)
    );

  const priceAccounts = await getBatchMultipleAccountsInfo(oracles, connection);

  return parsedReserves.reduce((acc, reserve, i) => {
    const pythOracleData = priceAccounts[i];
    const switchboardOracleData = priceAccounts[parsedReserves.length + i];

    let priceData:
      | {
          spotPrice: number;
          emaPrice: number;
        }
      | undefined;

    if (pythOracleData) {
      const { price, previousPrice, emaPrice } = parsePriceData(
        pythOracleData.data as Buffer
      );

      if (price || previousPrice) {
        // use latest price if available otherwise fallback to previous
        priceData = {
          spotPrice: price || previousPrice,
          emaPrice: emaPrice?.value ?? (price || previousPrice),
        };
      }
    }

    // Only attempt to fetch from switchboard if not already available from pyth
    if (!priceData) {
      const rawSb = switchboardOracleData;
      const switchboardData = (switchboardOracleData?.data as Buffer)?.slice(1);
      if (rawSb && switchboardData) {
        const owner = rawSb.owner.toString();
        if (owner === SBV2_MAINNET) {
          const result = switchboardProgram.decodeLatestAggregatorValue(rawSb!);

          priceData = {
            spotPrice: result?.toNumber() ?? 0,
            emaPrice: result?.toNumber() ?? 0,
          };
        }
      }
    }

    return {
      ...acc,
      [reserve.pubkey.toBase58()]: priceData,
    };
  }, {}) as {
    [address: string]:
      | {
          spotPrice: number;
          emaPrice: number;
        }
      | undefined;
  };
}
