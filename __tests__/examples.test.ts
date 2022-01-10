import "isomorphic-fetch";
import { Connection, PublicKey } from '@solana/web3.js';
import { SolendMarket } from "../dist";

describe("calculate", function () {
  it("reads solend market", async function () {

  const connection = new Connection('https://api.mainnet-beta.solana.com', {
    commitment: "finalized",
  });

    const market = await SolendMarket.initialize(
      connection
    );
    await market.loadReservesData();
    await market.loadRewardData();
    const reserve = market.reserves.find(res => res.config.symbol === 'USDC');
    expect(reserve!.data!.decimals).toEqual(6);
  });
});
