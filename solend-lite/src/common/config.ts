import { getProgramId } from "@solendprotocol/solend-sdk";

export const ENVIRONMENT = process.env.NEXT_PUBLIC_REACT_APP_NETWORK as string || "production";
export const PROGRAM_ID = getProgramId(ENVIRONMENT);
export const RPC_ENDPOINT = {
  name: "RPCPool",
  endpoint: process.env.NEXT_PUBLIC_RPCPOOL_RPC as string,
}

export const MAIN_POOL_ADDRESS = "4UpD2fh7xH3VP9QQaXtsS1YY3bxzWhtfpks7FatyKvdY";
export const MAIN_POOL_RESERVES_ADDRESSES = [
  "CviGNzD2C9ZCMmjDt5DKCce5cLV4Emrcm3NFvwudBFKA", // SLND
  "8PbodeaosQP19SjYFx855UMqWxH2HynZLdBXmsrbac36", // SOL
  "BgxfHJDzm44T7XG68MYKx7YisTjZu73tVovyZSjJMpmw", // USDC
  "8K9WC8xoh2rtQNY7iEGXtPvfbDCi563SdWhCAhuMP2xE", // USDT
  "CPDiKagfozERtJ33p7HHhEfJERjvfk1VAjMXAFLrvrKP", // ETH (Portal)
  "CCpirWrgNuBVLdkP2haxLTbD6XqEgaYuVXixbbpxUB6",  // mSOL
  "5sjkv6HD8wycocJ4tC4U36HHbvgcXYqcyiPRUkncnwWs", // stSOL
  "9n2exoMQwMTzfw6NFoFFujxYPndWVLtKREJePssrKb36", // RAY
  "5suXmvdbKQ98VonxGCXqViuWRu8k4zgZRxndYKsH2fJg", // SRM
  "8bDyV3N7ctLKoaSVqUoEwUzw6msS2F65yyNPgAVUisKm", // FTT (Portal)
  "FKZTsydxPShJ8baThobis6qFxTjALMkVC49EA88wqvm7", // ORCA
  "9mZsd1b9cN7JyqJvkbqhVuTfg8PAuKjuhPxpcsVNjYoC", // USDT-USDC
  "6ve8XyELbecPdbzSTsyhYKiWr7wg3JpjfxE1cqoN9qhN", // mSOL-SOL
  "DUExYJG5sc1SQdMMdq6LdUYW9ULXbo2fFFTbedywgjNN", // scnSOL
  "3PArRsZQ6SLkr1WERZWyC6AqsajtALMq4C66ZMYz4dKQ", // soETH (Sollet)
  "2dC4V23zJxuv521iYQj8c471jrxYLNQFaGS6YPwtTHMd", // soFTT (Sollet)
  "Hthrt4Lab21Yz1Dx9Q4sFW4WVihdBUTtWRQBjPsYHCor", // SBR
  "5Sb6wDpweg6mtYksPJ2pfGbSyikrhR8Ut8GszcULQ83A", // MER
  "Ab48bKsiEzdm481mGaNVmv9m9DmXsWWxcYHM588M59Yd", // UST (Portal)
  "GYzjMCXTDue12eUGKKWAqtF5jcBYNmewr6Db6LaguEaX"  // soBTC (Sollet)
];

export const SOLEND_ADDRESSES = new Set([
  "5pHk2TmnqQzRF9L6egy5FfiyBgS7G9cMZ5RFaJAvghzw",
  "yaDPAockQPna7Srx5LB2TugJSKHUduHghyZdQcn7zYz",
  "81KTtWjRndxGQbJHGJq6EaJWL8JfXbyywVvZReVPQd1X",
  "GDmSxpPzLkfxxr6dHLNRnCoYVGzvgc41tozkrr4pHTjB",
]);


export const ENDPOINTS = [
  {
    key: "rpcpool",
    name: "RPCPool",
    endpoint: process.env.NEXT_PUBLIC_RPCPOOL_RPC as string,
  },
  {
    key: "alchemy",
    name: "Alchemy",
    endpoint: process.env.NEXT_PUBLIC_ALCHEMY_RPC as string,
  },
];
