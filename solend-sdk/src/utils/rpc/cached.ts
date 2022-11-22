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
  data: { [key: string]: CachedObject | null };

  constructor(expireMS: number) {
    this.expireMS = expireMS;
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

  getAccountInfo(
    publicKey: PublicKey,
    commitmentOrConfig?: Commitment | GetAccountInfoConfig
  ): Promise<AccountInfo<Buffer> | null> {
    const key = `getAccountInfo_${publicKey.toBase58()}_${commitmentOrConfig}`;
    return (
      this.cache.get(key) ||
      this.cache.set(
        key,
        this.connection.getAccountInfo(publicKey, commitmentOrConfig)
      )
    );
  }

  getConfirmedSignaturesForAddress2(
    address: PublicKey,
    options?: ConfirmedSignaturesForAddress2Options,
    commitment?: Finality
  ): Promise<Array<ConfirmedSignatureInfo>> {
    const key = `getConfirmedSignaturesForAddress2_${address.toBase58()}_${JSON.stringify(
      options
    )}_${commitment}}`;
    return (
      this.cache.get(key) ||
      this.cache.set(
        key,
        this.connection.getConfirmedSignaturesForAddress2(
          address,
          options,
          commitment
        )
      )
    );
  }

  getLatestBlockhash(
    commitmentOrConfig?: Commitment | GetLatestBlockhashConfig
  ): Promise<BlockhashWithExpiryBlockHeight> {
    const key = `getLatestBlockhash_${commitmentOrConfig}`;
    return (
      this.cache.get(key) ||
      this.cache.set(
        key,
        this.connection.getLatestBlockhash(commitmentOrConfig)
      )
    );
  }

  getMultipleAccountsInfo(
    publicKeys: PublicKey[],
    commitmentOrConfig?: Commitment | GetMultipleAccountsConfig
  ): Promise<(AccountInfo<Buffer> | null)[]> {
    const key = `getMultipleAccountsInfo_${publicKeys
      .map((pk) => pk.toBase58)
      .join("_")}_${JSON.stringify(commitmentOrConfig)}`;
    return (
      this.cache.get(key) ||
      this.cache.set(
        key,
        this.connection.getMultipleAccountsInfo(publicKeys, commitmentOrConfig)
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
    const key = `getProgramAccounts_${programId.toBase58()}_${JSON.stringify(
      configOrCommitment
    )}`;
    return (
      this.cache.get(key) ||
      this.cache.set(
        key,
        this.connection.getProgramAccounts(programId, configOrCommitment)
      )
    );
  }

  getRecentBlockhash(commitment?: Commitment): Promise<{
    blockhash: Blockhash;
    feeCalculator: FeeCalculator;
  }> {
    const key = `getRecentBlockhash_${commitment}`;
    return (
      this.cache.get(key) ||
      this.cache.set(key, this.connection.getRecentBlockhash(commitment))
    );
  }

  getSlot(commitmentOrConfig?: Commitment | GetSlotConfig): Promise<number> {
    const key = `getSlot_${commitmentOrConfig}`;
    return (
      this.cache.get(key) ||
      this.cache.set(key, this.connection.getSlot(commitmentOrConfig))
    );
  }

  getTokenAccountBalance(
    tokenAddress: PublicKey,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<TokenAmount>> {
    const key = `getTokenAccountBalance_${tokenAddress.toBase58()}_${commitment}`;
    return (
      this.cache.get(key) ||
      this.cache.set(
        key,
        this.connection.getTokenAccountBalance(tokenAddress, commitment)
      )
    );
  }

  getTokenSupply(
    tokenMintAddress: PublicKey,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<TokenAmount>> {
    const key = `getTokenSupply_${tokenMintAddress.toBase58()}_${commitment}`;
    return (
      this.cache.get(key) ||
      this.cache.set(
        key,
        this.connection.getTokenSupply(tokenMintAddress, commitment)
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
    const key = `getTransaction_${signature}_${JSON.stringify(rawConfig)}`;
    return (
      this.cache.get(key) ||
      this.cache.set(key, this.connection.getTransaction(signature, rawConfig))
    );
  }

  // This does not make sense to cache, so we don't
  sendTransaction(
    transaction: VersionedTransaction,
    options?: SendOptions
  ): Promise<TransactionSignature> {
    return this.connection.sendTransaction(transaction, options);
  }

  simulateTransaction(
    transaction: VersionedTransaction,
    config?: SimulateTransactionConfig
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    const key = `simulateTransaction_${JSON.stringify(
      transaction
    )}_${JSON.stringify(config)}`;
    return (
      this.cache.get(key) ||
      this.cache.set(
        key,
        this.connection.simulateTransaction(transaction, config)
      )
    );
  }

  getAddressLookupTable(
    accountKey: PublicKey,
    config?: GetAccountInfoConfig
  ): Promise<RpcResponseAndContext<AddressLookupTableAccount | null>> {
    const key = `getAddressLookupTable_${accountKey.toBase58()}_${JSON.stringify(
      config
    )}`;
    return (
      this.cache.get(key) ||
      this.cache.set(
        key,
        this.connection.getAddressLookupTable(accountKey, config)
      )
    );
  }
}
