/* eslint-disable max-classes-per-file */
import { Connection, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { SolendReserve } from "./reserve";
import { Obligation, parseObligation } from "../state/obligation";
import BN from "bn.js";
import { WAD } from "./constants";
import { calculatePositions } from "./utils";
import { simulateTransaction } from "@project-serum/anchor/dist/cjs/utils/rpc";

export type Position = {
  mintAddress: string;
  amount: BN;
};

export type ObligationStats = {
  liquidationThreshold: number;
  userTotalDeposit: number;
  userTotalBorrow: number;
  borrowLimit: number;
  borrowUtilization: number;
  netAccountValue: number;
  positions: number;
};

export class SolendObligation {
  walletAddress: PublicKey;

  obligationAddress: PublicKey;

  deposits: Array<Position>;

  borrows: Array<Position>;

  obligationStats: ObligationStats;

  constructor(
    walletAddress: PublicKey,
    obligationAddress: PublicKey,
    obligation: Obligation,
    reserves: Array<SolendReserve>
  ) {
    this.walletAddress = walletAddress;
    this.obligationAddress = obligationAddress;

    const positionDetails = calculatePositions(obligation, reserves);

    this.deposits = positionDetails.deposits;
    this.borrows = positionDetails.borrows;
    this.obligationStats = positionDetails.stats;
  }

  static async fetchObligationByAddress(
    obligationAddress: PublicKey,
    connection: Connection,
  ) {

    const rawObligationData = await connection.getAccountInfo(
      obligationAddress
    );

    if (!rawObligationData) {
      return null;
    }

    const parsedObligation = parseObligation(
      PublicKey.default,
      rawObligationData!
    );
    
    return parsedObligation
  }
}
