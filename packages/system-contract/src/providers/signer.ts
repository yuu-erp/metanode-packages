import { Addressable } from "../address";
import { AccountState, Provider, TransactionRequest, TransactionResponse } from "./provider";

/**
 *  A Signer represents an account on the Ethereum Blockchain, and is most often
 *  backed by a private key represented by a mnemonic or residing on a Hardware Wallet.
 *
 *  The API remains abstract though, so that it can deal with more advanced exotic
 *  Signing entities, such as Smart Contract Wallets or Virtual Wallets (where the
 *  private key may not be known).
 */
export interface Signer extends Addressable {
  /**
   *  The [[Provider]] attached to this Signer (if any).
   */
  provider: null | Provider;

  /**
   *  Returns a new instance of this Signer connected to //provider// or detached
   *  from any Provider if null.
   */
  connect(provider: null | Provider): Signer;

  /**
   *  Signs %%tx%%, returning the fully signed transaction. This does not
   *  populate any additional properties within the transaction.
   */
  signTransaction(tx: TransactionRequest): Promise<string>;

  /**
   *  Sends %%tx%% to the Network. The ``signer.populateTransaction(tx)``
   *  is called first to ensure all necessary properties for the
   *  transaction to be valid have been popualted first.
   */
  sendTransaction(tx: TransactionRequest): Promise<TransactionResponse>;
}

/**
 *  A [[SmartAccountSigner]] represents a signer whose account lifecycle
 *  is managed on-chain and may require an explicit initialization step
 *  before it can be used to send transactions.
 *
 *  Unlike a traditional Externally Owned Account (EOA), a smart account
 *  may not be immediately usable upon creation. For example, the account
 *  might require registering a public key (e.g. a BLS public key) or
 *  performing other on-chain setup actions before normal transactions
 *  are allowed.
 *
 *  A [[SmartAccountSigner]] extends the base [[Signer]] abstraction by
 *  adding awareness of the account state and lifecycle, allowing it to:
 *
 *  - Query the current on-chain [[AccountState]]
 *  - Automatically perform one-time initialization when required
 *  - Enforce account policies before sending transactions
 *
 *  This enables a seamless developer experience where dApps can interact
 *  with smart accounts in the same way as EOAs, without manually handling
 *  initialization or special-case logic.
 */
export interface SmartAccountSigner extends Signer {
  /**
   *  Resolves the current on-chain state of the signer account.
   *
   *  This typically includes information such as:
   *  - The account nonce
   *  - Registered public keys (e.g. BLS public key)
   *  - Account type or status flags
   *
   *  This method **does not modify state** and should be treated as a
   *  read-only operation.
   *
   *  @returns A promise that resolves to the current [[AccountState]].
   */
  getAccountState(): Promise<AccountState>;

  /**
   *  Ensures that the signer account is fully initialized and ready
   *  to send transactions.
   *
   *  Implementations may perform one or more on-chain transactions
   *  as part of the initialization process (for example, registering
   *  a public key or activating the account).
   *
   *  This method MUST be idempotent:
   *  - If the account is already initialized, it should resolve
   *    without performing any action.
   *  - If initialization is required, it should perform the minimum
   *    necessary steps to make the account usable.
   *
   *  Typical usage is internal, invoked automatically by
   *  [[Signer.sendTransaction]] before submitting the first transaction.
   *  Advanced users may also call this method explicitly to eagerly
   *  initialize an account.
   */
  ensureInitialized(): Promise<void>;
}
