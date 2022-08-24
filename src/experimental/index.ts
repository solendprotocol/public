/* eslint-disable no-unused-vars */
import {
  Connection,
  Keypair,
  PublicKey,
} from "@solana/web3.js";
import {
  SOLEND_BETA_PROGRAM_ID,
  parseLendingMarket,
  parseReserve,
  parseObligation,
  obligationToString,
} from "../../dist";
import {
  Jupiter,
} from "@jup-ag/core";
import { MsolStrategyTxBuilder } from "./StrategyTxBuilder";

const SOLANA_RPC_ENDPOINT =
  "https://solend.rpcpool.com/a3e03ba77d5e870c8c694b19d61c";

const connection = new Connection(SOLANA_RPC_ENDPOINT);

const WALLET_PRIVATE_KEY: number[] = JSON.parse(
  process.env.WALLET_PRIVATE_KEY || "[]"
);
export const USER_KEYPAIR = Keypair.fromSecretKey(
  Uint8Array.from(WALLET_PRIVATE_KEY)
);

// const readKeyfile = (filePath: string): Keypair => {
//   if (filePath[0] == "~") {
//     filePath = path.join(process.env.HOME as string, filePath.slice(1));
//   }

//   return Keypair.fromSecretKey(
//     Uint8Array.from(JSON.parse(readFileSync(filePath, { encoding: "utf-8" })))
//   );
// };

// export const USER_KEYPAIR = readKeyfile("~/.config/solana/id.json");

const main = async () => {
  const action = process.argv[2];

  const payer = USER_KEYPAIR;

  const lendingMarketKey = new PublicKey(
    "HB1cecsgnFPBfKxEDfarVtKXEARWuViJKCqztWiFB3Uk"
  );
  const lendingMarketAccount = await connection.getAccountInfo(
    lendingMarketKey
  );
  if (lendingMarketAccount == null) {
    return;
  }

  const lendingMarket = parseLendingMarket(
    lendingMarketKey,
    lendingMarketAccount
  );

  const usdcReserveKey = new PublicKey(
    "AtSBZ8CRwAAkxtvtqdaxQ8YBpebwCio7epjrE2qFHru9"
  );
  const usdcReserveAccount = await connection.getAccountInfo(usdcReserveKey);
  if (usdcReserveAccount == null) {
    return;
  }
  const usdcReserve = parseReserve(usdcReserveKey, usdcReserveAccount);

  const solReserveKey = new PublicKey(
    "h346nBr4UmAss3LjbFGBugjJHNcegQFw9ih6g9woNme"
  );
  const solReserveAccount = await connection.getAccountInfo(solReserveKey);
  if (solReserveAccount == null) {
    return;
  }
  const solReserve = parseReserve(solReserveKey, solReserveAccount);

  const msolReserveKey = new PublicKey(
    "E7SMTfMiy7gLcpEv7JD9XGDwipaNC4agzGYRp48ZFRpZ"
  );
  const msolReserveAccount = await connection.getAccountInfo(msolReserveKey);
  if (msolReserveAccount == null) {
    return;
  }
  const msolReserve = parseReserve(msolReserveKey, msolReserveAccount);

  const txBuilder = await MsolStrategyTxBuilder.initialize(
    connection,
    USER_KEYPAIR.publicKey,
    msolReserve,
    solReserve,
    SOLEND_BETA_PROGRAM_ID,
    lendingMarketKey
  );

  // preLever
  if (action == "view") {
    const obligationAddress = new PublicKey(process.argv[3]);
    const obligationAccount = await connection.getAccountInfo(
      obligationAddress
    );

    if (obligationAccount == null) {
      return;
    }
    const obligation = parseObligation(obligationAddress, obligationAccount);
    console.log(obligationToString(obligation!.info));
    return;
  }
  // lever
  if (action == "lever") {
    const { extraSigner, setup, lever } = await txBuilder.buildLeverTxs(1e8);

    if (setup.instructions.length > 0) {
      console.log("setup");
      const sig = await connection.sendTransaction(setup, [payer, extraSigner]);
      console.log(sig);
      await connection.confirmTransaction(sig);
    } else {
      console.log("skipping setup");
    }

    console.log("levering!");
    const sig = await connection.sendTransaction(lever, [payer], {
      skipPreflight: false,
    });
    console.log(sig);
    await connection.confirmTransaction(sig);
  }

  // de-lever
  if (action == "delever") {
    const jupiter = await Jupiter.load({
      connection,
      cluster: "mainnet-beta",
      user: USER_KEYPAIR, // or public key
    });

    console.log("delevering!");

    const obligationAccount = await connection.getAccountInfo(
      txBuilder.obligationKey
    );
    const obligation = parseObligation(
      txBuilder.obligationKey,
      obligationAccount!
    );

    const deleverTx = await txBuilder.buildDeleverTx(obligation!, jupiter);
    const sig = await connection.sendTransaction(deleverTx, [payer], {
      skipPreflight: false,
    });
    console.log(sig);
    await connection.confirmTransaction(sig);
  }

  return;
};

main();
