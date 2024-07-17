import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { parsePriceData } from "@pythnetwork/client";
import SwitchboardProgram from "@switchboard-xyz/sbv2-lite";
import { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver";
import { getBatchMultipleAccountsInfo } from "./utils";
import { Reserve } from "../../state";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

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
  const pythSolanaReceiver = new PythSolanaReceiver({
    connection,
    wallet: new NodeWallet(Keypair.fromSeed(new Uint8Array(32).fill(1))),
  });

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
      if (
        pythOracleData.owner.toBase58() ===
        pythSolanaReceiver.receiver.programId.toBase58()
      ) {
        // pythData = pythSolanaReceiver.receiver.coder.accounts.decode(
        //   'priceUpdateV2',
        //   pythOracleData.data,
        // );
        const priceUpdate =
          pythSolanaReceiver.receiver.account.priceUpdateV2.coder.accounts.decode(
            "priceUpdateV2",
            pythOracleData.data
          );
        const exponent = 10 ** priceUpdate.priceMessage.exponent;
        const spotPrice = priceUpdate.priceMessage.price.toNumber() * exponent;
        const emaPrice =
          priceUpdate.priceMessage.emaPrice.toNumber() * exponent;

        priceData = {
          spotPrice,
          emaPrice,
        };
      } else {
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
