import {
  AccountInfo,
  Blockhash,
  BlockhashWithExpiryBlockHeight,
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
  GetVersionedTransactionConfig,
  PublicKey,
  RpcResponseAndContext,
  SendOptions,
  SimulatedTransactionResponse,
  SimulateTransactionConfig,
  TokenAmount,
  TransactionSignature,
  Version,
  VersionedTransaction,
  VersionedTransactionResponse,
} from "@solana/web3.js";
import { StatsD } from "hot-shots";

// Connection and MultiConnection should both implement SolendRPCConnection
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
    rawConfig: GetVersionedTransactionConfig
  ): Promise<VersionedTransactionResponse | null>;
  sendTransaction(
    transaction: Version,
    options?: SendOptions
  ): Promise<TransactionSignature>;

  simulateTransaction(
    transaction: VersionedTransaction,
    config?: SimulateTransactionConfig
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>>;
}

// MultiConnection implements SolendRPCConnection
export class MultiConnection {
  connections: SolendRPCConnection[];
  public rpcEndpoint: string;

  constructor(connections: SolendRPCConnection[]) {
    this.connections = connections;
    this.rpcEndpoint = this.connections[0].rpcEndpoint;
  }

  getAccountInfo(
    publicKey: PublicKey,
    commitmentOrConfig?: Commitment | GetAccountInfoConfig
  ): Promise<AccountInfo<Buffer> | null> {
    return Promise.race(
      this.connections.map((c) =>
        c.getAccountInfo(publicKey, commitmentOrConfig)
      )
    );
  }
  getConfirmedSignaturesForAddress2(
    address: PublicKey,
    options?: ConfirmedSignaturesForAddress2Options,
    commitment?: Finality
  ): Promise<Array<ConfirmedSignatureInfo>> {
    return Promise.race(
      this.connections.map((c) =>
        c.getConfirmedSignaturesForAddress2(address, options, commitment)
      )
    );
  }
  getLatestBlockhash(
    commitmentOrConfig?: Commitment | GetLatestBlockhashConfig
  ): Promise<BlockhashWithExpiryBlockHeight> {
    return Promise.race(
      this.connections.map((c) => c.getLatestBlockhash(commitmentOrConfig))
    );
  }
  getMultipleAccountsInfo(
    publicKeys: PublicKey[],
    commitmentOrConfig?: Commitment | GetMultipleAccountsConfig
  ): Promise<(AccountInfo<Buffer> | null)[]> {
    return Promise.race(
      this.connections.map((c) =>
        c.getMultipleAccountsInfo(publicKeys, commitmentOrConfig)
      )
    );
  }
  getProgramAccounts(
    programId: PublicKey,
    configOrCommitment?: GetProgramAccountsConfig | Commitment
  ): Promise<
    Array<{
      pubkey: PublicKey;
      account: AccountInfo<Buffer>;
    }>
  > {
    return Promise.race(
      this.connections.map((c) =>
        c.getProgramAccounts(programId, configOrCommitment)
      )
    );
  }
  getRecentBlockhash(commitment?: Commitment): Promise<{
    blockhash: Blockhash;
    feeCalculator: FeeCalculator;
  }> {
    return Promise.race(
      this.connections.map((c) => c.getRecentBlockhash(commitment))
    );
  }
  getSlot(commitmentOrConfig?: Commitment | GetSlotConfig): Promise<number> {
    return Promise.race(
      this.connections.map((c) => c.getSlot(commitmentOrConfig))
    );
  }
  getTokenAccountBalance(
    tokenAddress: PublicKey,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<TokenAmount>> {
    return Promise.race(
      this.connections.map((c) =>
        c.getTokenAccountBalance(tokenAddress, commitment)
      )
    );
  }

  getTokenSupply(
    tokenMintAddress: PublicKey,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<TokenAmount>> {
    return Promise.race(
      this.connections.map((c) =>
        c.getTokenSupply(tokenMintAddress, commitment)
      )
    );
  }

  getTransaction(
    signature: string,
    rawConfig: GetVersionedTransactionConfig
  ): Promise<VersionedTransactionResponse | null> {
    return Promise.race(
      this.connections.map((c) => c.getTransaction(signature, rawConfig))
    );
  }

  // Does it make sense to do multiple instances of this?
  sendTransaction(
    transaction: Version,
    options?: SendOptions
  ): Promise<TransactionSignature> {
    return Promise.race(
      this.connections.map((c) => c.sendTransaction(transaction, options))
    );
  }
  simulateTransaction(
    transaction: VersionedTransaction,
    config?: SimulateTransactionConfig
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    return Promise.race(
      this.connections.map((c) => c.simulateTransaction(transaction, config))
    );
  }
}

// Adds statsd metrics to RPC calls
export class InstrumentedConnection {
  connection: SolendRPCConnection;
  statsd: StatsD;
  prefix: string;
  public rpcEndpoint: string;

  constructor(
    connection: SolendRPCConnection,
    statsd: StatsD,
    prefix: string = ""
  ) {
    this.connection = connection;
    this.statsd = statsd;
    this.prefix = prefix;
    this.rpcEndpoint = this.connection.rpcEndpoint;
  }

  async getAccountInfo(
    publicKey: PublicKey,
    commitmentOrConfig?: Commitment | GetAccountInfoConfig
  ): Promise<AccountInfo<Buffer> | null> {
    return this.withStats(
      this.connection.getAccountInfo(publicKey, commitmentOrConfig),
      "getAccountInfo"
    );
  }
  async getConfirmedSignaturesForAddress2(
    address: PublicKey,
    options?: ConfirmedSignaturesForAddress2Options,
    commitment?: Finality
  ): Promise<Array<ConfirmedSignatureInfo>> {
    return this.withStats(
      this.connection.getConfirmedSignaturesForAddress2(
        address,
        options,
        commitment
      ),
      "getConfirmedSignaturesForAddress2"
    );
  }
  getLatestBlockhash(
    commitmentOrConfig?: Commitment | GetLatestBlockhashConfig
  ): Promise<BlockhashWithExpiryBlockHeight> {
    return this.withStats(
      this.connection.getLatestBlockhash(commitmentOrConfig),
      "getLatestBlockhash"
    );
  }
  getMultipleAccountsInfo(
    publicKeys: PublicKey[],
    commitmentOrConfig?: Commitment | GetMultipleAccountsConfig
  ): Promise<(AccountInfo<Buffer> | null)[]> {
    return this.withStats(
      this.connection.getMultipleAccountsInfo(publicKeys, commitmentOrConfig),
      "getMultipleAccountsInfo"
    );
  }
  getProgramAccounts(
    programId: PublicKey,
    configOrCommitment?: GetProgramAccountsConfig | Commitment
  ): Promise<
    Array<{
      pubkey: PublicKey;
      account: AccountInfo<Buffer>;
    }>
  > {
    return this.withStats(
      this.connection.getProgramAccounts(programId, configOrCommitment),
      "getProgramAccounts"
    );
  }
  getRecentBlockhash(commitment?: Commitment): Promise<{
    blockhash: Blockhash;
    feeCalculator: FeeCalculator;
  }> {
    return this.withStats(
      this.connection.getRecentBlockhash(commitment),
      "getRecentBlockhash"
    );
  }
  getSlot(commitmentOrConfig?: Commitment | GetSlotConfig): Promise<number> {
    return this.withStats(
      this.connection.getSlot(commitmentOrConfig),
      "getSlot"
    );
  }
  getTokenAccountBalance(
    tokenAddress: PublicKey,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<TokenAmount>> {
    return this.withStats(
      this.connection.getTokenAccountBalance(tokenAddress, commitment),
      "getTokenAccountBalance"
    );
  }

  getTokenSupply(
    tokenMintAddress: PublicKey,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<TokenAmount>> {
    return this.withStats(
      this.connection.getTokenSupply(tokenMintAddress, commitment),
      "getTokenSupply"
    );
  }
  getTransaction(
    signature: string,
    rawConfig: GetVersionedTransactionConfig
  ): Promise<VersionedTransactionResponse | null> {
    return this.withStats(
      this.connection.getTransaction(signature, rawConfig),
      "getTransaction"
    );
  }
  sendTransaction(
    transaction: Version,
    options?: SendOptions
  ): Promise<TransactionSignature> {
    return this.withStats(
      this.connection.sendTransaction(transaction, options),
      "sendTransaction"
    );
  }
  simulateTransaction(
    transaction: VersionedTransaction,
    config?: SimulateTransactionConfig
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    return this.withStats(
      this.connection.simulateTransaction(transaction, config),
      "simulateTransaction"
    );
  }

  async withStats(fn: Promise<any>, fnName: string) {
    this.statsd.increment(this.prefix + "_" + fnName);
    const start = Date.now();
    let result;
    try {
      result = await fn;
    } catch (e: any) {
      this.statsd.increment(this.prefix + "_" + fnName + "_error");
      throw e;
    }
    const duration = Date.now() - start;
    this.statsd.gauge(this.prefix + "_" + fnName + "_duration", duration);
    return result;
  }
}

// Adds retries to RPC Calls
export class RetryConnection {
  connection: SolendRPCConnection;
  maxRetries: number;
  public rpcEndpoint: string;
  constructor(connection: SolendRPCConnection, maxRetries: number = 3) {
    this.connection = connection;
    this.maxRetries = maxRetries;
    this.rpcEndpoint = this.connection.rpcEndpoint;
  }

  async getAccountInfo(
    publicKey: PublicKey,
    commitmentOrConfig?: Commitment | GetAccountInfoConfig
  ): Promise<AccountInfo<Buffer> | null> {
    return this.withRetries(
      this.connection.getAccountInfo(publicKey, commitmentOrConfig)
    );
  }
  async getConfirmedSignaturesForAddress2(
    address: PublicKey,
    options?: ConfirmedSignaturesForAddress2Options,
    commitment?: Finality
  ): Promise<Array<ConfirmedSignatureInfo>> {
    return this.withRetries(
      this.connection.getConfirmedSignaturesForAddress2(
        address,
        options,
        commitment
      )
    );
  }
  getLatestBlockhash(
    commitmentOrConfig?: Commitment | GetLatestBlockhashConfig
  ): Promise<BlockhashWithExpiryBlockHeight> {
    return this.withRetries(
      this.connection.getLatestBlockhash(commitmentOrConfig)
    );
  }
  getMultipleAccountsInfo(
    publicKeys: PublicKey[],
    commitmentOrConfig?: Commitment | GetMultipleAccountsConfig
  ): Promise<(AccountInfo<Buffer> | null)[]> {
    return this.withRetries(
      this.connection.getMultipleAccountsInfo(publicKeys, commitmentOrConfig)
    );
  }
  getProgramAccounts(
    programId: PublicKey,
    configOrCommitment?: GetProgramAccountsConfig | Commitment
  ): Promise<
    Array<{
      pubkey: PublicKey;
      account: AccountInfo<Buffer>;
    }>
  > {
    return this.withRetries(
      this.connection.getProgramAccounts(programId, configOrCommitment)
    );
  }
  getRecentBlockhash(commitment?: Commitment): Promise<{
    blockhash: Blockhash;
    feeCalculator: FeeCalculator;
  }> {
    return this.withRetries(this.connection.getRecentBlockhash(commitment));
  }
  getSlot(commitmentOrConfig?: Commitment | GetSlotConfig): Promise<number> {
    return this.withRetries(this.connection.getSlot(commitmentOrConfig));
  }
  getTokenAccountBalance(
    tokenAddress: PublicKey,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<TokenAmount>> {
    return this.withRetries(
      this.connection.getTokenAccountBalance(tokenAddress, commitment)
    );
  }

  getTokenSupply(
    tokenMintAddress: PublicKey,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<TokenAmount>> {
    return this.withRetries(
      this.connection.getTokenSupply(tokenMintAddress, commitment)
    );
  }
  getTransaction(
    signature: string,
    rawConfig: GetVersionedTransactionConfig
  ): Promise<VersionedTransactionResponse | null> {
    return this.withRetries(
      this.connection.getTransaction(signature, rawConfig)
    );
  }
  sendTransaction(
    transaction: Version,
    options?: SendOptions
  ): Promise<TransactionSignature> {
    return this.withRetries(
      this.connection.sendTransaction(transaction, options)
    );
  }
  simulateTransaction(
    transaction: VersionedTransaction,
    config?: SimulateTransactionConfig
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    return this.withRetries(
      this.connection.simulateTransaction(transaction, config)
    );
  }

  async withRetries(fn: Promise<any>) {
    let numTries = 0;
    let lastException;
    while (numTries <= this.maxRetries) {
      try {
        return await fn;
      } catch (e: any) {
        lastException = e;
        numTries += 1;
      }
    }
    throw lastException;
  }
}
