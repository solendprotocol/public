import {
  PACKET_DATA_SIZE,
  PublicKey,
  Signer,
  TransactionInstruction,
} from "@solana/web3.js";

/**
 * If the transaction doesn't contain a `setComputeUnitLimit` instruction, the default compute budget is 200,000 units per instruction.
 */
export const DEFAULT_COMPUTE_BUDGET_UNITS = 200000;

/**
 * The maximum size of a Solana transaction, leaving some room for the compute budget instructions.
 */
export const PACKET_DATA_SIZE_WITH_ROOM_FOR_COMPUTE_BUDGET =
  PACKET_DATA_SIZE - 52;

/**
 * An instruction with some extra information that will be used to build transactions.
 */
export type InstructionWithEphemeralSigners = {
  /** The instruction */
  instruction: TransactionInstruction;
  /** The ephemeral signers that need to sign the transaction where this instruction will be */
  signers: Signer[];
  /** The compute units that this instruction requires, useful if greater than `DEFAULT_COMPUTE_BUDGET_UNITS`  */
  computeUnits?: number;
};

/**
 * The priority fee configuration for transactions
 */
export type PriorityFeeConfig = {
  /** This is the priority fee in micro lamports, it gets passed down to `setComputeUnitPrice`  */
  computeUnitPriceMicroLamports?: number;
  tightComputeBudget?: boolean;
  jitoTipLamports?: number;
  jitoBundleSize?: number;
};

/**
 * A default priority fee configuration. Using a priority fee is helpful even when you're not writing to hot accounts.
 */
export const DEFAULT_PRIORITY_FEE_CONFIG: PriorityFeeConfig = {
  computeUnitPriceMicroLamports: 50000,
};

/**
 * Get the size of a transaction that would contain the provided array of instructions
 * This is based on {@link https://solana.com/docs/core/transactions}.
 *
 * Each transaction has the following layout :
 *
 * - A compact array of all signatures
 * - A 3-bytes message header
 * - A compact array with all the account addresses
 * - A recent blockhash
 * - A compact array of instructions
 *
 * If the transaction is a `VersionedTransaction`, it also contains an extra byte at the beginning, indicating the version and an array of `MessageAddressTableLookup` at the end.
 * After this field there is an array of indexes into the address lookup table that represents the accounts from the address lookup table used in the transaction.
 *
 * Each instruction has the following layout :
 * - One byte indicating the index of the program in the account addresses array
 * - A compact array of indices into the account addresses array, indicating which accounts are used by the instruction
 * - A compact array of serialized instruction data
 */
export function getSizeOfTransaction(
  instructions: TransactionInstruction[],
  versionedTransaction = true,
  addressLookupTableAddresses?: PublicKey[]
): number {
  const programs = new Set<string>();
  const signers = new Set<string>();
  let accounts = new Set<string>();

  instructions.map((ix) => {
    programs.add(ix.programId.toBase58());
    accounts.add(ix.programId.toBase58());
    ix.keys.map((key) => {
      if (key.isSigner) {
        signers.add(key.pubkey.toBase58());
      }
      accounts.add(key.pubkey.toBase58());
    });
  });

  const instruction_sizes: number = instructions
    .map(
      (ix) =>
        1 +
        getSizeOfCompressedU16(ix.keys.length) +
        ix.keys.length +
        getSizeOfCompressedU16(ix.data.length) +
        ix.data.length
    )
    .reduce((a, b) => a + b, 0);

  let numberOfAddressLookups = 0;
  if (addressLookupTableAddresses) {
    const lookupTableAddresses = addressLookupTableAddresses.map((address) =>
      address.toBase58()
    );
    const totalNumberOfAccounts = accounts.size;
    accounts = new Set(
      [...accounts].filter((account) => !lookupTableAddresses.includes(account))
    );
    accounts = new Set([...accounts, ...programs, ...signers]);
    numberOfAddressLookups = totalNumberOfAccounts - accounts.size; // This number is equal to the number of accounts that are in the lookup table and are neither signers nor programs
  }

  return (
    getSizeOfCompressedU16(signers.size) +
    signers.size * 64 + // array of signatures
    3 +
    getSizeOfCompressedU16(accounts.size) +
    32 * accounts.size + // array of account addresses
    32 + // recent blockhash
    getSizeOfCompressedU16(instructions.length) +
    instruction_sizes + // array of instructions
    (versionedTransaction ? 1 + getSizeOfCompressedU16(0) : 0) + // transaction version and number of address lookup tables
    (versionedTransaction && addressLookupTableAddresses ? 32 : 0) + // address lookup table address (we only support 1 address lookup table)
    (versionedTransaction && addressLookupTableAddresses ? 2 : 0) + // number of address lookup indexes
    numberOfAddressLookups // address lookup indexes
  );
}

/**
 * Get the size of n in bytes when serialized as a CompressedU16. Compact arrays use a CompactU16 to store the length of the array.
 */
export function getSizeOfCompressedU16(n: number) {
  return 1 + Number(n >= 128) + Number(n >= 16384);
}
