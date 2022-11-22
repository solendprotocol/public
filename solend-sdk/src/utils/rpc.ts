import {
  AccountInfo,
  AddressLookupTableAccount,
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
  GetTransactionConfig,
  GetVersionedTransactionConfig,
  PublicKey,
  RpcResponseAndContext,
  SendOptions,
  SimulatedTransactionResponse,
  SimulateTransactionConfig,
  TokenAmount,
  TransactionResponse,
  TransactionSignature,
  VersionedTransaction,
  VersionedTransactionResponse,
} from "@solana/web3.js";
import { StatsD } from "hot-shots";

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
}

// MultiConnection implements SolendRPCConnection
// The default connection is index 0, the rest are backups.
// The default connection's result gets returned as soon as possible
// If the default connection takes longer than backupDelay ms to return,
// the first backup connection to return gets returned.
export class MultiConnection {
  public rpcEndpoint: string;
  delay: number;
  connections: SolendRPCConnection[];

  constructor(connections: SolendRPCConnection[], backupDelay: number = 500) {
    this.connections = connections;
    this.rpcEndpoint = this.connections[0].rpcEndpoint;
    this.delay = backupDelay;
  }

  getAccountInfo(
    publicKey: PublicKey,
    commitmentOrConfig?: Commitment | GetAccountInfoConfig
  ): Promise<AccountInfo<Buffer> | null> {
    return Promise.race(
      this.connections.map((c, index) =>
        delayed(
          index === 0 ? 0 : this.delay,
          c.getAccountInfo(publicKey, commitmentOrConfig)
        )
      )
    );
  }
  getConfirmedSignaturesForAddress2(
    address: PublicKey,
    options?: ConfirmedSignaturesForAddress2Options,
    commitment?: Finality
  ): Promise<Array<ConfirmedSignatureInfo>> {
    return Promise.race(
      this.connections.map((c, index) =>
        delayed(
          index === 0 ? 0 : this.delay,
          c.getConfirmedSignaturesForAddress2(address, options, commitment)
        )
      )
    );
  }
  getLatestBlockhash(
    commitmentOrConfig?: Commitment | GetLatestBlockhashConfig
  ): Promise<BlockhashWithExpiryBlockHeight> {
    return Promise.race(
      this.connections.map((c, index) =>
        delayed(
          index === 0 ? 0 : this.delay,
          c.getLatestBlockhash(commitmentOrConfig)
        )
      )
    );
  }
  getMultipleAccountsInfo(
    publicKeys: PublicKey[],
    commitmentOrConfig?: Commitment | GetMultipleAccountsConfig
  ): Promise<(AccountInfo<Buffer> | null)[]> {
    return Promise.race(
      this.connections.map((c, index) =>
        delayed(
          index === 0 ? 0 : this.delay,
          c.getMultipleAccountsInfo(publicKeys, commitmentOrConfig)
        )
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
      this.connections.map((c, index) =>
        delayed(
          index === 0 ? 0 : this.delay,
          c.getProgramAccounts(programId, configOrCommitment)
        )
      )
    );
  }
  getRecentBlockhash(commitment?: Commitment): Promise<{
    blockhash: Blockhash;
    feeCalculator: FeeCalculator;
  }> {
    return Promise.race(
      this.connections.map((c, index) =>
        delayed(index === 0 ? 0 : this.delay, c.getRecentBlockhash(commitment))
      )
    );
  }
  getSlot(commitmentOrConfig?: Commitment | GetSlotConfig): Promise<number> {
    return Promise.race(
      this.connections.map((c, index) =>
        delayed(index === 0 ? 0 : this.delay, c.getSlot(commitmentOrConfig))
      )
    );
  }
  getTokenAccountBalance(
    tokenAddress: PublicKey,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<TokenAmount>> {
    return Promise.race(
      this.connections.map((c, index) =>
        delayed(
          index === 0 ? 0 : this.delay,
          c.getTokenAccountBalance(tokenAddress, commitment)
        )
      )
    );
  }
  getTokenSupply(
    tokenMintAddress: PublicKey,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<TokenAmount>> {
    return Promise.race(
      this.connections.map((c, index) =>
        delayed(
          index === 0 ? 0 : this.delay,
          c.getTokenSupply(tokenMintAddress, commitment)
        )
      )
    );
  }
  getTransaction(
    signature: string,
    rawConfig?: GetTransactionConfig
  ): Promise<TransactionResponse | null>;
  getTransaction(
    signature: string,
    rawConfig: GetVersionedTransactionConfig
  ): Promise<VersionedTransactionResponse | null> {
    return Promise.race(
      this.connections.map((c, index) =>
        delayed(
          index === 0 ? 0 : this.delay,
          c.getTransaction(signature, rawConfig)
        )
      )
    );
  }
  // Does it make sense to do multiple instances of this?
  sendTransaction(
    transaction: VersionedTransaction,
    options?: SendOptions
  ): Promise<TransactionSignature> {
    return Promise.race(
      this.connections.map((c, index) =>
        delayed(
          index === 0 ? 0 : this.delay,
          c.sendTransaction(transaction, options)
        )
      )
    );
  }
  simulateTransaction(
    transaction: VersionedTransaction,
    config?: SimulateTransactionConfig
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    return Promise.race(
      this.connections.map((c, index) =>
        delayed(
          index === 0 ? 0 : this.delay,
          c.simulateTransaction(transaction, config)
        )
      )
    );
  }
  getAddressLookupTable(
    accountKey: PublicKey,
    config?: GetAccountInfoConfig
  ): Promise<RpcResponseAndContext<AddressLookupTableAccount | null>> {
    return Promise.race(
      this.connections.map((c, index) =>
        delayed(
          index === 0 ? 0 : this.delay,
          c.getAddressLookupTable(accountKey, config)
        )
      )
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
    rawConfig?: GetTransactionConfig
  ): Promise<TransactionResponse | null>;
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
    transaction: VersionedTransaction,
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
  getAddressLookupTable(
    accountKey: PublicKey,
    config?: GetAccountInfoConfig
  ): Promise<RpcResponseAndContext<AddressLookupTableAccount | null>> {
    return this.withStats(
      this.connection.getAddressLookupTable(accountKey, config),
      "getAddressLookupTable"
    );
  }
  async withStats(fn: Promise<any>, fnName: string) {
    const tags = [`rpc:${this.prefix}`, `function:${fnName}`];
    this.statsd.increment("rpc_method_call", tags);
    const start = Date.now();
    let result;
    try {
      result = await fn;
    } catch (e: any) {
      this.statsd.increment("rpc_method_error", tags);
      throw e;
    }
    const duration = Date.now() - start;
    this.statsd.gauge("rpc_method_duration", duration, tags);
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
    rawConfig?: GetTransactionConfig
  ): Promise<TransactionResponse | null>;
  getTransaction(
    signature: string,
    rawConfig: GetVersionedTransactionConfig
  ): Promise<VersionedTransactionResponse | null> {
    return this.withRetries(
      this.connection.getTransaction(signature, rawConfig)
    );
  }
  sendTransaction(
    transaction: VersionedTransaction,
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
  getAddressLookupTable(
    accountKey: PublicKey,
    config?: GetAccountInfoConfig
  ): Promise<RpcResponseAndContext<AddressLookupTableAccount | null>> {
    return this.withRetries(
      this.connection.getAddressLookupTable(accountKey, config)
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function delayed(ms: number, promise: any) {
  const promises = [promise, sleep(ms)];
  return (await Promise.all(promises))[0];
}
