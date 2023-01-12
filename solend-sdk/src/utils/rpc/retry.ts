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

// Adds retries to RPC Calls
export class RetryConnection implements SolendRPCConnection {
  connection: SolendRPCConnection;
  maxRetries: number;
  public rpcEndpoint: string;
  constructor(connection: SolendRPCConnection, maxRetries: number = 3) {
    this.connection = connection;
    this.maxRetries = maxRetries;
    this.rpcEndpoint = this.connection.rpcEndpoint;
  }

  getAccountInfo(
    publicKey: PublicKey,
    commitmentOrConfig?: Commitment | GetAccountInfoConfig
  ): Promise<AccountInfo<Buffer> | null> {
    return this.withRetries(
      this.connection.getAccountInfo(publicKey, commitmentOrConfig)
    );
  }

  getConfirmedSignaturesForAddress2(
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

  confirmTransaction(
    strategy: BlockheightBasedTransactionConfirmationStrategy,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<SignatureResult>> {
    return this.withRetries(
      this.connection.confirmTransaction(strategy, commitment)
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
