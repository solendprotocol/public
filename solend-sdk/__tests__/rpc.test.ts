import { Connection } from '@solana/web3.js';
import { StatsD } from 'hot-shots';
import { InstrumentedConnection, MultiConnection, RetryConnection, SolendRPCConnection } from '../src/rpc';

jest.setTimeout(1_000);

describe("calculate", function () {
  it("checks interface fulfillment", async function () {
    const connection = new Connection('https://api.mainnet-beta.solana.com', {
      commitment: "finalized",
    });
    const multiConnection = new MultiConnection([connection]);
    _checkInterface(multiConnection);

    const retryConection = new RetryConnection(connection, 10);
    _checkInterface(retryConection);

    const stats = new StatsD({mock: true});
    const instrumentedConnection = new InstrumentedConnection(connection, stats, '');
    _checkInterface(instrumentedConnection);
  });
});

// You can't check if a class implements an interface at runtime, so we can 
// just do it at compile time here with a function that does nothing.
function _checkInterface(connection: SolendRPCConnection) {
  return;
}
