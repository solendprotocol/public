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

// MultiConnection implements SolendRPCConnection
// The default connection is index 0, the rest are backups.
// The default connection's result gets returned as soon as possible
// If the default connection takes longer than backupDelay ms to return,
// the first backup connection to return gets returned.
export class MultiConnection implements SolendRPCConnection {
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

  confirmTransaction(
    strategy: BlockheightBasedTransactionConfirmationStrategy,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<SignatureResult>> {
    return Promise.race(
      this.connections.map((c, index) =>
        delayed(
          index === 0 ? 0 : this.delay,
          c.confirmTransaction(strategy, commitment)
        )
      )
    );
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function delayed(ms: number, promise: any) {
  const promises = [promise, sleep(ms)];
  return (await Promise.all(promises))[0];
}
