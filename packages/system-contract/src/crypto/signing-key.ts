import { BytesLike, hexlify } from "../utils";
// @ts-ignore
import blsLib from "../scripts/bls_20250911_1625.min";

/**
 *  A **SigningKey** provides high-level access to the elliptic curve
 *  cryptography (ECC) operations and key management.
 */
export class SigningKey {
  #privateKey: string;

  constructor(privateKey: BytesLike) {
    this.#privateKey = hexlify(privateKey);
  }

  get privateKey(): string {
    return this.#privateKey;
  }

  static computePublicKey(key: BytesLike): string {
    const privateKey = hexlify(key);
    const { public_key } = blsLib.getKeyPair(privateKey);
    return hexlify(public_key);
  }
}
