/**
 * Utility types for Ethereum-like blockchain interactions.
 * These types are inspired by common Ethereum standards but defined purely in TypeScript for strict typing.
 */

// Represents an Ethereum address as a hexadecimal string.
export type Address = `0x${string}`;

// Represents a block identifier, which can be a number or a special tag.
export type BlockTag = number | "latest" | "earliest" | "pending";

// Represents a network configuration.
export interface Network {
  chainId: number;
  name: string;
  ensAddress?: Address; // Optional ENS registry address.
}

// Represents a account state in the blockchain.
export interface AccountState {
  accountType: number;
  address: Address;
  balance: string;
  deviceKey: string;
  lastHash: string;
  nonce: number;
  pendingBalance: string;
  publicKeyBls: string;
}

// Represents a block in the blockchain.
export interface Block {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: number;
  transactions: string[]; // Array of transaction hashes.
  // Additional fields can be added for extensibility.
}

// Represents a request to send a transaction.
export interface TransactionRequest {
  from?: Address;
  to?: Address;
  value?: bigint; // Amount of native currency to send.
  data?: string; // Hex-encoded data for contract calls.
  gasLimit?: bigint;
  gasPrice?: bigint; // For legacy transactions.
  maxFeePerGas?: bigint; // For EIP-1559.
  maxPriorityFeePerGas?: bigint; // For EIP-1559.
  nonce?: number;
  chainId?: number;
  type?: number; // Transaction type (0 for legacy, 2 for EIP-1559).
}

// Represents a transaction response after broadcasting.
export interface TransactionResponse {
  hash: string;
  from: Address;
  to?: Address;
  value: bigint;
  data: string;
  gasLimit: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce: number;
  chainId: number;
  blockNumber?: number;
  blockHash?: string;
  timestamp?: number;
  // Wait method could be added if needed, but kept simple here.
}

// Represents a transaction receipt after mining.
export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  from: Address;
  to?: Address;
  contractAddress?: Address; // If contract creation.
  status: number; // 1 for success, 0 for failure.
  gasUsed: bigint;
  effectiveGasPrice: bigint;
  logs: Log[];
  logsBloom: string;
}

// Represents a log entry from a transaction.
export interface Log {
  address: Address;
  topics: string[]; // Array of indexed topics.
  data: string; // Non-indexed data.
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
  blockHash: string;
  logIndex: number;
  removed: boolean; // True if log was removed due to chain reorg.
}

// Filter for querying logs.
export interface LogFilter {
  fromBlock?: BlockTag;
  toBlock?: BlockTag;
  address?: Address | Address[];
  topics?: (string | string[] | null)[]; // Array of topics with OR logic.
}

/**
 * Reader interface for read-only operations.
 * This separates concerns for read operations, following SOLID principles (Single Responsibility).
 */
export interface Reader {
  /**
   * Queries transac        bb  tions based on a search query.
   * Uses the standard `mtn_searchTransactions` method.
   *
   * @param {string} queryString - Block number, transaction hash, address, or token address.
   * @param {number} offset - The starting position of the result set (used for pagination).
   *                          For example, 0 starts from the first result.
   * @param {number} limit - The maximum number of results to return.
   * @returns {Promise<any>} - The corresponding transaction data.
   */
  searchTransactions(queryString: string, offset: number, limit: number): Promise<string>;

  /**
   * Retrieve device key based on lastHash.
   * Uses the standard `mtn_getDeviceKey` method.
   * @returns Promise resolving to the AccountState object.
   */
  getDeviceKey(lastHash: string): Promise<string>;

  /**
   * Retrieve your current account information.
   * Uses the standard `mtn_getAccountState` method.
   * @returns Promise resolving to the AccountState object.
   */
  getAccountState(address: Address): Promise<AccountState>;

  /**
   * Retrieves the current network information.
   * @returns Promise resolving to the Network object.
   */
  getNetwork(): Promise<Network>;

  /**
   * Retrieves the latest block number.
   * @returns Promise resolving to the current block number.
   */
  getBlockNumber(): Promise<number>;

  /**
   * Retrieves block information by number or tag.
   * @param block - Block number or 'latest'.
   * @returns Promise resolving to the Block object.
   */
  getBlock(block: number | "latest"): Promise<Block>;

  /**
   * Retrieves the balance of an address.
   * @param address - The address to query.
   * @param blockTag - Optional block tag (defaults to 'latest').
   * @returns Promise resolving to the balance as bigint.
   */
  getBalance(address: Address, blockTag?: BlockTag): Promise<bigint>;

  /**
   * Retrieves the transaction count (nonce) of an address.
   * @param address - The address to query.
   * @param blockTag - Optional block tag (defaults to 'latest').
   * @returns Promise resolving to the transaction count.
   */
  getTransactionCount(address: Address, blockTag?: BlockTag): Promise<number>;

  /**
   * Retrieves a transaction by its hash.
   * @param txHash - The transaction hash.
   * @returns Promise resolving to TransactionResponse or null if not found.
   */
  getTransaction(txHash: string): Promise<TransactionResponse | null>;

  /**
   * Retrieves a transaction receipt by its hash.
   * @param txHash - The transaction hash.
   * @returns Promise resolving to TransactionReceipt or null if not mined.
   */
  getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null>;

  /**
   * Simulates a contract call without sending a transaction.
   * @param tx - The transaction request.
   * @param blockTag - Optional block tag (defaults to 'latest').
   * @returns Promise resolving to the hex-encoded result.
   */
  call(tx: TransactionRequest, blockTag?: BlockTag): Promise<string>;

  /**
   * Estimates the gas required for a transaction.
   * @param tx - The transaction request.
   * @returns Promise resolving to the estimated gas as bigint.
   */
  estimateGas(tx: TransactionRequest): Promise<bigint>;

  /**
   * Retrieves logs matching the filter.
   * @param filter - The log filter criteria.
   * @returns Promise resolving to an array of Log objects.
   */
  getLogs(filter: LogFilter): Promise<Log[]>;
}

/**
 * Writer interface for write operations (transactions).
 * This separates write responsibilities for better modularity.
 */
export interface Writer {
  /**
   * Sends a signed transaction to the network.
   * @param signedTx - The hex-encoded signed transaction.
   * @returns Promise resolving to TransactionResponse.
   */
  sendTransaction(signedTx: string): Promise<TransactionResponse>;
}

/**
 * EventEmitter interface for event handling.
 * Allows subscribing to events like new blocks or logs.
 */
export interface EventEmitter {
  /**
   * Registers a listener for the specified event.
   * @param event - Event name or array of topics.
   * @param listener - Callback function.
   */
  on(event: string | string[], listener: (...args: unknown[]) => void): void;

  /**
   * Unregisters a listener for the specified event.
   * @param event - Event name or array of topics.
   * @param listener - Callback function to remove.
   */
  off(event: string | string[], listener: (...args: unknown[]) => void): void;
}

/**
 * Provider interface combining Reader, Writer, and EventEmitter.
 * This allows for easy extension (e.g., for different chains) by implementing this interface.
 * Designed for ethers.js-style usage but pure TypeScript for clean architecture.
 */
export interface Provider extends Reader, Writer, EventEmitter {}
