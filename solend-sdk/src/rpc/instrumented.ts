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
  GetProgramAccountsResponse,
  GetSlotConfig,
  GetTransactionConfig,
  GetVersionedTransactionConfig,
  PublicKey,
  RpcResponseAndContext,
  SendOptions,
  SignatureResult,
  SignaturesForAddressOptions,
  SignatureStatus,
  SignatureStatusConfig,
  SimulatedTransactionResponse,
  SimulateTransactionConfig,
  TokenAmount,
  TransactionResponse,
  TransactionSignature,
  VersionedMessage,
  VersionedTransaction,
  VersionedTransactionResponse,
} from "@solana/web3.js";
import { StatsD } from "hot-shots";
import { SolendRPCConnection } from "./interface";

// Adds statsd metrics to RPC calls
export class InstrumentedConnection implements SolendRPCConnection {
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

  getAccountInfo(
    publicKey: PublicKey,
    commitmentOrConfig?: Commitment | GetAccountInfoConfig
  ): Promise<AccountInfo<Buffer> | null> {
    return this.withStats(
      this.connection.getAccountInfo(publicKey, commitmentOrConfig),
      "getAccountInfo"
    );
  }

  getConfirmedSignaturesForAddress2(
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
  ): Promise<GetProgramAccountsResponse> {
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

  async confirmTransaction(
    strategy: BlockheightBasedTransactionConfirmationStrategy,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<SignatureResult>> {
    return this.withStats(
      this.connection.confirmTransaction(strategy, commitment),
      "confirmTransaction"
    );
  }

  async getSignatureStatus(
    signature: TransactionSignature,
    config?: SignatureStatusConfig
  ): Promise<RpcResponseAndContext<SignatureStatus | null>> {
    return this.withStats(
      this.connection.getSignatureStatus(signature, config),
      "getSignatureStatus"
    );
  }

  async getSignatureStatuses(
    signatures: Array<TransactionSignature>,
    config?: SignatureStatusConfig
  ): Promise<RpcResponseAndContext<Array<SignatureStatus | null>>> {
    return this.withStats(
      this.connection.getSignatureStatuses(signatures, config),
      "getSignatureStatuses"
    );
  }

  async getSignaturesForAddress(
    address: PublicKey,
    options?: SignaturesForAddressOptions,
    commitment?: Finality
  ): Promise<Array<ConfirmedSignatureInfo>> {
    return this.withStats(
      this.connection.getSignaturesForAddress(address, options, commitment),
      "getSignaturesForAddress"
    );
  }

  async getBlocks(
    startSlot: number,
    endSlot?: number,
    commitment?: Finality
  ): Promise<Array<number>> {
    return this.withStats(
      this.connection.getBlocks(startSlot, endSlot, commitment),
      "getBlocks"
    );
  }

  async getFeeForMessage(
    message: VersionedMessage,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<number | null>> {
    return this.withStats(
      this.connection.getFeeForMessage(message, commitment),
      "getFeeForMessage"
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
