import assert from "assert";
import type {
  AccountState,
  Address,
  BlockTag,
  Provider,
  TransactionRequest,
  TransactionResponse,
} from ".";
import { defineProperties } from "../utils";
import { Signer, SmartAccountSigner } from "./signer";

export abstract class AbstractSigner<P extends null | Provider = null | Provider>
  implements SmartAccountSigner
{
  readonly provider!: P;

  constructor(provider?: P) {
    defineProperties<AbstractSigner>(this, {
      provider: provider ?? null,
    });
  }

  /* ------------------------------------------------------------------
   * Identity
   * ------------------------------------------------------------------ */

  abstract getAddress(): Promise<Address>;

  abstract connect(provider: null | Provider): Signer;

  /* ------------------------------------------------------------------
   * Account state
   * ------------------------------------------------------------------ */

  async getAccountState(): Promise<AccountState> {
    assert(this.provider, "Signer has no provider");
    const address = await this.getAddress();
    return this.provider.getAccountState(address);
  }

  /**
   * Ensure the account is initialized on-chain.
   * Default implementation is no-op (EOA-like).
   * Smart account signers SHOULD override this.
   */
  async ensureInitialized(): Promise<void> {
    // no-op by default
  }

  /* ------------------------------------------------------------------
   * Transaction lifecycle
   * ------------------------------------------------------------------ */

  /**
   * Sign a populated transaction and return the raw signed payload.
   * Concrete signers MUST implement this.
   */
  abstract signTransaction(tx: TransactionRequest): Promise<string>;

  /**
   * Send a transaction to the network.
   *
   * This method enforces the standard signer flow:
   *  1. Ensure the account is initialized
   *  2. Populate missing transaction fields
   *  3. Sign the transaction
   *  4. Send via provider
   */
  async sendTransaction(tx: TransactionRequest): Promise<TransactionResponse> {
    assert(this.provider, "Signer has no provider");

    await this.ensureInitialized();

    const populatedTx = await this.populateTransaction(tx);
    const signedTx = await this.signTransaction(populatedTx);

    return this.provider.sendTransaction(signedTx);
  }

  /* ------------------------------------------------------------------
   * Helpers
   * ------------------------------------------------------------------ */

  async getNonce(blockTag?: BlockTag): Promise<number> {
    assert(this.provider, "Signer has no provider");
    const address = await this.getAddress();
    return this.provider.getTransactionCount(address, blockTag);
  }

  protected async populateTransaction(tx: TransactionRequest): Promise<TransactionRequest> {
    assert(this.provider, "Signer has no provider");

    const from = tx.from ?? (await this.getAddress());
    const nonce = tx.nonce ?? (await this.provider.getTransactionCount(from, "pending"));
    const network = await this.provider.getNetwork();

    return {
      ...tx,
      from,
      nonce,
      chainId: tx.chainId ?? network.chainId,
    };
  }
}
