import assert from "assert";
import type { BlockTag, Provider } from ".";
import { defineProperties } from "../utils";
import { Signer } from "./signer";

export abstract class AbstractSigner<P extends null | Provider = null | Provider>
  implements Signer
{
  readonly provider!: P;
  constructor(provider?: P) {
    defineProperties<AbstractSigner>(this, { provider: provider || null });
  }

  /**
   *  Resolves to the Signer address.
   */
  abstract getAddress(): Promise<string>;

  /**
   *  Returns the signer connected to %%provider%%.
   *
   *  This may throw, for example, a Signer connected over a Socket or
   *  to a specific instance of a node may not be transferrable.
   */
  abstract connect(provider: null | Provider): Signer;
  async getNonce(blockTag?: BlockTag): Promise<number> {
    throw new Error("Method not implements!");
  }
}
