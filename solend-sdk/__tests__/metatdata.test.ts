import {
    Connection,
    PublicKey,
  } from "@solana/web3.js";
  import { getTokenInfosFromMetadata } from "../src";
  
  jest.setTimeout(50_000);
  
  describe("check", function () {
    it("parses obligation in both formats", async function () {
        const connection = new Connection("https://api.mainnet-beta.solana.com", {
            commitment: "finalized",
        });
      const tokens = await getTokenInfosFromMetadata([
        'n54ZwXEcLnc3o7zK48nhrLV4KTU5wWD4iq7Gvdt5tik',
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
      ], connection)

      console.log(tokens);
    });
  });
  