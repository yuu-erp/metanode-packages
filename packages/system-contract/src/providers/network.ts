/**
 *  A **Network** provides access to a chain's properties and allows
 *  for plug-ins to extend functionality.
 */
export class Network {
  #name: string;
  #chainId: number;

  constructor(name: string, chainId: number) {
    this.#name = name;
    this.#chainId = chainId;
  }
  /**
   *  Returns a JSON-compatible representation of a Network.
   */
  toJSON(): { name: string; chainId: number } {
    return { name: this.name, chainId: this.chainId };
  }

  /**
   *  The network common name.
   *
   *  This is the canonical name, as networks migh have multiple
   *  names.
   */
  get name(): string {
    return this.#name;
  }
  set name(value: string) {
    this.#name = value;
  }

  /**
   *  The network chain ID.
   */
  get chainId(): number {
    return this.#chainId;
  }
  set chainId(value: number) {
    this.#chainId = value;
  }
}
