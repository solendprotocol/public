import {
  AddressLookupTableAccount,
  Connection,
  PublicKey,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import { ObligationType, PoolType, ReserveType } from "../core";
import BN from "bn.js";
import JSBI from "jsbi";
export default class Margin {
  connection: Connection;
  obligation?: ObligationType;
  owner: PublicKey;
  obligationAddress: PublicKey;
  longReserve: ReserveType;
  shortReserve: ReserveType;
  pool: PoolType;
  longReserveLiquidityAta: PublicKey;
  longReserveCollateralAta: PublicKey;
  shortReserveLiquidityAta: PublicKey;
  shortReserveCollateralAta: PublicKey;
  obligationSeed: string;
  lendingMarketAuthority: PublicKey;
  constructor(
    connection: Connection,
    owner: PublicKey,
    longReserve: ReserveType,
    shortReserve: ReserveType,
    pool: PoolType,
    obligationAddress: PublicKey,
    obligationSeed: string,
    obligation?: ObligationType
  );
  setupTx: () => Promise<{
    tx: VersionedTransaction;
    obligationAddress: PublicKey;
  }>;
  getSolendAccountCount: () => number;
  leverTx: (
    swapBaseAmount: BN,
    route: {
      outAmount: JSBI;
      slippageBps: number;
    },
    swapInstructions: Array<TransactionInstruction>,
    lookupTableAccounts: AddressLookupTableAccount[]
  ) => Promise<VersionedTransaction>;
}
