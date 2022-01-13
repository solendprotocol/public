import { Connection } from '@solana/web3.js';
import { SolendMarket } from "../dist";

describe("calculate", function () {
  it("reads solend market", async function () {

  const connection = new Connection('https://api.mainnet-beta.solana.com', {
    commitment: "finalized",
  });

    const market = await SolendMarket.initialize(
      connection
    );
    await market.loadReserves();
    await market.loadRewards();
    const reserve = market.reserves.find(res => res.config.symbol === 'USDC');
    expect(reserve!.stats!.decimals).toEqual(6);
  });
});
