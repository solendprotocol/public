import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
} from "@solana/web3.js";
import BN from "bn.js";
import { Obligation } from "./../state/obligation";
import { EnvironmentType, PoolType, ReserveType } from "./types";
export type ActionType =
  | "deposit"
  | "borrow"
  | "withdraw"
  | "repay"
  | "mint"
  | "redeem"
  | "depositCollateral"
  | "withdrawCollateral"
  | "forgive";
export declare class SolendActionCore {
  programId: PublicKey;
  connection: Connection;
  reserve: ReserveType;
  pool: PoolType;
  publicKey: PublicKey;
  obligationAddress: PublicKey;
  obligationAccountInfo: Obligation | null;
  userTokenAccountAddress: PublicKey;
  userCollateralAccountAddress: PublicKey;
  seed: string;
  positions?: number;
  amount: BN;
  hostAta?: PublicKey;
  setupIxs: Array<TransactionInstruction>;
  lendingIxs: Array<TransactionInstruction>;
  cleanupIxs: Array<TransactionInstruction>;
  preTxnIxs: Array<TransactionInstruction>;
  postTxnIxs: Array<TransactionInstruction>;
  depositReserves: Array<PublicKey>;
  borrowReserves: Array<PublicKey>;
  private constructor();
  static initialize(
    pool: PoolType,
    reserve: ReserveType,
    action: ActionType,
    amount: BN,
    publicKey: PublicKey,
    connection: Connection,
    environment?: EnvironmentType,
    customObligationAddress?: PublicKey,
    hostAta?: PublicKey
  ): Promise<SolendActionCore>;
  static buildForgiveTxns(
    pool: PoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    publicKey: PublicKey,
    obligationAddress: PublicKey,
    environment?: EnvironmentType
  ): Promise<SolendActionCore>;
  static buildDepositTxns(
    pool: PoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    publicKey: PublicKey,
    environment?: EnvironmentType,
    obligationAddress?: PublicKey
  ): Promise<SolendActionCore>;
  static buildBorrowTxns(
    pool: PoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    publicKey: PublicKey,
    environment?: EnvironmentType,
    hostAta?: PublicKey
  ): Promise<SolendActionCore>;
  static buildDepositReserveLiquidityTxns(
    pool: PoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    publicKey: PublicKey,
    environment?: EnvironmentType
  ): Promise<SolendActionCore>;
  static buildRedeemReserveCollateralTxns(
    pool: PoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    publicKey: PublicKey,
    environment?: EnvironmentType
  ): Promise<SolendActionCore>;
  static buildDepositObligationCollateralTxns(
    pool: PoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    publicKey: PublicKey,
    environment?: EnvironmentType
  ): Promise<SolendActionCore>;
  static buildWithdrawCollateralTxns(
    pool: PoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    publicKey: PublicKey,
    environment?: EnvironmentType
  ): Promise<SolendActionCore>;
  static buildWithdrawTxns(
    pool: PoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    publicKey: PublicKey,
    environment?: EnvironmentType
  ): Promise<SolendActionCore>;
  static buildRepayTxns(
    pool: PoolType,
    reserve: ReserveType,
    connection: Connection,
    amount: string,
    publicKey: PublicKey,
    environment?: EnvironmentType
  ): Promise<SolendActionCore>;
  getTransactions(): Promise<{
    preLendingTxn: Transaction | null;
    lendingTxn: Transaction | null;
    postLendingTxn: Transaction | null;
  }>;
  sendTransactions(
    sendTransaction: (
      txn: Transaction,
      connection: Connection
    ) => Promise<TransactionSignature>,
    preCallback?: () => void,
    lendingCallback?: () => void,
    postCallback?: () => void
  ): Promise<string>;
  private sendSingleTransaction;
  addForgiveIx(): void;
  addDepositIx(): void;
  addDepositReserveLiquidityIx(): void;
  addRedeemReserveCollateralIx(): void;
  addWithdrawObligationCollateralIx(): Promise<void>;
  addDepositObligationCollateralIx(): void;
  addBorrowIx(): void;
  addWithdrawIx(): Promise<void>;
  addRepayIx(): Promise<void>;
  addSupportIxs(action: ActionType): Promise<void>;
  private addRefreshIxs;
  private addObligationIxs;
  private addAtaIxs;
  private updateWSOLAccount;
}
