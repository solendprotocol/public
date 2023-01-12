import {
  AccountInfo,
  AddressLookupTableAccount,
  Blockhash,
  BlockhashWithExpiryBlockHeight,
  BlockheightBasedTransactionConfirmationStrategy,
  Commitment,
  ConfirmedSignatureInfo,
  ConfirmedSignaturesForAddress2Options,
  FeeCalculator,
  Finality,
  GetAccountInfoConfig,
  GetLatestBlockhashConfig,
  GetMultipleAccountsConfig,
  GetProgramAccountsConfig,
  GetSlotConfig,
  GetTransactionConfig,
  GetVersionedTransactionConfig,
  PublicKey,
  RpcResponseAndContext,
  SendOptions,
  SignatureResult,
  SimulatedTransactionResponse,
  SimulateTransactionConfig,
  TokenAmount,
  TransactionResponse,
  TransactionSignature,
  VersionedTransaction,
  VersionedTransactionResponse,
} from "@solana/web3.js";

// Connection and and all *Connection classes should implement
// SolendRPCConnection
export interface SolendRPCConnection {
  rpcEndpoint: string;

  getAccountInfo(
    publicKey: PublicKey,
    commitmentOrConfig?: Commitment | GetAccountInfoConfig
  ): Promise<AccountInfo<Buffer> | null>;
  getConfirmedSignaturesForAddress2(
    address: PublicKey,
    options?: ConfirmedSignaturesForAddress2Options,
    commitment?: Finality
  ): Promise<Array<ConfirmedSignatureInfo>>;
  getLatestBlockhash(
    commitmentOrConfig?: Commitment | GetLatestBlockhashConfig
  ): Promise<BlockhashWithExpiryBlockHeight>;
  getMultipleAccountsInfo(
    publicKeys: PublicKey[],
    commitmentOrConfig?: Commitment | GetMultipleAccountsConfig
  ): Promise<(AccountInfo<Buffer> | null)[]>;
  getProgramAccounts(
    programId: PublicKey,
    configOrCommitment?: GetProgramAccountsConfig | Commitment
  ): Promise<
    Array<{
      pubkey: PublicKey;
      account: AccountInfo<Buffer>;
    }>
  >;
  getRecentBlockhash(commitment?: Commitment): Promise<{
    blockhash: Blockhash;
    feeCalculator: FeeCalculator;
  }>;
  getSlot(commitmentOrConfig?: Commitment | GetSlotConfig): Promise<number>;
  getTokenAccountBalance(
    tokenAddress: PublicKey,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<TokenAmount>>;
  getTokenSupply(
    tokenMintAddress: PublicKey,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<TokenAmount>>;
  getTransaction(
    signature: string,
    rawConfig?: GetTransactionConfig
  ): Promise<TransactionResponse | null>;
  getTransaction(
    signature: string,
    rawConfig: GetVersionedTransactionConfig
  ): Promise<VersionedTransactionResponse | null>;
  sendTransaction(
    transaction: VersionedTransaction,
    options?: SendOptions
  ): Promise<TransactionSignature>;
  simulateTransaction(
    transaction: VersionedTransaction,
    config?: SimulateTransactionConfig
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>>;
  getAddressLookupTable(
    accountKey: PublicKey,
    config?: GetAccountInfoConfig
  ): Promise<RpcResponseAndContext<AddressLookupTableAccount | null>>;
  confirmTransaction(
    strategy: BlockheightBasedTransactionConfirmationStrategy,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<SignatureResult>>;
}
