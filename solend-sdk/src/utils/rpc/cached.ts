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
import { SolendRPCConnection } from "./interface";

export interface RPCCacheInterface {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<any>;
}

type CachedObject = {
  timestamp: number;
  value: any;
};

export class InMemoryCache implements RPCCacheInterface {
  expireMS: number;
  maxCacheSize: number | null;
  data: { [key: string]: CachedObject | null };

  constructor(expireMS: number, maxCacheSize: number | null = null) {
    this.expireMS = expireMS;
    this.maxCacheSize = maxCacheSize;
    this.data = {};
  }

  async get(key: string) {
    const cachedObject = this.data[key];
    if (cachedObject === undefined || cachedObject === null) {
      return null;
    }
    const msElapsed = Date.now() - cachedObject.timestamp;
    if (msElapsed > this.expireMS) {
      this.data[key] = null;
      return null;
    }
    return cachedObject.value;
  }

  async set(key: string, valuePromise: Promise<any>) {
    const value = await valuePromise;
    this.data[key] = {
      timestamp: Date.now(),
      value: value,
    };
    // We don't want to let the cache get infinitely big
    // so we just discard the oldest item
    if (
      this.maxCacheSize !== null &&
      Object.keys(this.data).length === this.maxCacheSize
    ) {
      delete this.data[Object.keys(this.data)[0]];
    }
    return value;
  }
}

// Wraps a cache around a connection. You can define a custom cache by
// implementing the RPCCache interface
export class CachedConnection implements SolendRPCConnection {
  connection: SolendRPCConnection;
  cache: RPCCacheInterface;
  public rpcEndpoint: string;

  constructor(connection: SolendRPCConnection, cache: RPCCacheInterface) {
    this.connection = connection;
    this.rpcEndpoint = this.connection.rpcEndpoint;
    this.cache = cache;
  }

  async getAccountInfo(
    publicKey: PublicKey,
    commitmentOrConfig?: Commitment | GetAccountInfoConfig
  ): Promise<AccountInfo<Buffer> | null> {
    const key = `getAccountInfo_${publicKey.toBase58()}_${commitmentOrConfig}`;
    return (
      (await this.cache.get(key)) ||
      (await this.cache.set(
        key,
        this.connection.getAccountInfo(publicKey, commitmentOrConfig)
      ))
    );
  }

  async getConfirmedSignaturesForAddress2(
    address: PublicKey,
    options?: ConfirmedSignaturesForAddress2Options,
    commitment?: Finality
  ): Promise<Array<ConfirmedSignatureInfo>> {
    const key = `getConfirmedSignaturesForAddress2_${address.toBase58()}_${JSON.stringify(
      options
    )}_${commitment}}`;
    return (
      (await this.cache.get(key)) ||
      (await this.cache.set(
        key,
        this.connection.getConfirmedSignaturesForAddress2(
          address,
          options,
          commitment
        )
      ))
    );
  }

  async getLatestBlockhash(
    commitmentOrConfig?: Commitment | GetLatestBlockhashConfig
  ): Promise<BlockhashWithExpiryBlockHeight> {
    const key = `getLatestBlockhash_${commitmentOrConfig}`;
    return (
      (await this.cache.get(key)) ||
      (await this.cache.set(
        key,
        this.connection.getLatestBlockhash(commitmentOrConfig)
      ))
    );
  }

  async getMultipleAccountsInfo(
    publicKeys: PublicKey[],
    commitmentOrConfig?: Commitment | GetMultipleAccountsConfig
  ): Promise<(AccountInfo<Buffer> | null)[]> {
    const key = `getMultipleAccountsInfo_${publicKeys
      .map((pk) => pk.toBase58)
      .join("_")}_${JSON.stringify(commitmentOrConfig)}`;
    return (
      (await this.cache.get(key)) ||
      (await this.cache.set(
        key,
        this.connection.getMultipleAccountsInfo(publicKeys, commitmentOrConfig)
      ))
    );
  }

  async getProgramAccounts(
    programId: PublicKey,
    configOrCommitment?: GetProgramAccountsConfig | Commitment
  ): Promise<
    Array<{
      pubkey: PublicKey;
      account: AccountInfo<Buffer>;
    }>
  > {
    const key = `getProgramAccounts_${programId.toBase58()}_${JSON.stringify(
      configOrCommitment
    )}`;
    return (
      (await this.cache.get(key)) ||
      (await this.cache.set(
        key,
        this.connection.getProgramAccounts(programId, configOrCommitment)
      ))
    );
  }

  async getRecentBlockhash(commitment?: Commitment): Promise<{
    blockhash: Blockhash;
    feeCalculator: FeeCalculator;
  }> {
    const key = `getRecentBlockhash_${commitment}`;
    return (
      (await this.cache.get(key)) ||
      (await this.cache.set(
        key,
        this.connection.getRecentBlockhash(commitment)
      ))
    );
  }

  async getSlot(
    commitmentOrConfig?: Commitment | GetSlotConfig
  ): Promise<number> {
    const key = `getSlot_${commitmentOrConfig}`;
    return (
      (await this.cache.get(key)) ||
      (await this.cache.set(key, this.connection.getSlot(commitmentOrConfig)))
    );
  }

  async getTokenAccountBalance(
    tokenAddress: PublicKey,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<TokenAmount>> {
    const key = `getTokenAccountBalance_${tokenAddress.toBase58()}_${commitment}`;
    return (
      (await this.cache.get(key)) ||
      (await this.cache.set(
        key,
        this.connection.getTokenAccountBalance(tokenAddress, commitment)
      ))
    );
  }

  async getTokenSupply(
    tokenMintAddress: PublicKey,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<TokenAmount>> {
    const key = `getTokenSupply_${tokenMintAddress.toBase58()}_${commitment}`;
    return (
      (await this.cache.get(key)) ||
      (await this.cache.set(
        key,
        this.connection.getTokenSupply(tokenMintAddress, commitment)
      ))
    );
  }

  async getTransaction(
    signature: string,
    rawConfig?: GetTransactionConfig
  ): Promise<TransactionResponse | null>;

  async getTransaction(
    signature: string,
    rawConfig: GetVersionedTransactionConfig
  ): Promise<VersionedTransactionResponse | null> {
    const key = `getTransaction_${signature}_${JSON.stringify(rawConfig)}`;
    return (
      (await this.cache.get(key)) ||
      (await this.cache.set(
        key,
        this.connection.getTransaction(signature, rawConfig)
      ))
    );
  }

  // This does not make sense to cache, so we don't
  async sendTransaction(
    transaction: VersionedTransaction,
    options?: SendOptions
  ): Promise<TransactionSignature> {
    return await this.connection.sendTransaction(transaction, options);
  }

  async simulateTransaction(
    transaction: VersionedTransaction,
    config?: SimulateTransactionConfig
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    const key = `simulateTransaction_${JSON.stringify(
      transaction
    )}_${JSON.stringify(config)}`;
    return (
      (await this.cache.get(key)) ||
      (await this.cache.set(
        key,
        this.connection.simulateTransaction(transaction, config)
      ))
    );
  }

  async getAddressLookupTable(
    accountKey: PublicKey,
    config?: GetAccountInfoConfig
  ): Promise<RpcResponseAndContext<AddressLookupTableAccount | null>> {
    const key = `getAddressLookupTable_${accountKey.toBase58()}_${JSON.stringify(
      config
    )}`;
    return (
      (await this.cache.get(key)) ||
      (await this.cache.set(
        key,
        this.connection.getAddressLookupTable(accountKey, config)
      ))
    );
  }

  async confirmTransaction(
    strategy: BlockheightBasedTransactionConfirmationStrategy,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<SignatureResult>> {
    const key = `confirmTransaction_${JSON.stringify(strategy)}_${commitment}`;
    return (
      (await this.cache.get(key)) ||
      (await this.cache.set(
        key,
        this.connection.confirmTransaction(strategy, commitment)
      ))
    );
  }
}
