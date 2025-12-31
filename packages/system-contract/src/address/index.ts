import { Address } from "../providers";

/**
 *  An interface for objects which have an address, and can
 *  resolve it asyncronously.
 *
 *  This allows objects such as [[Signer]] or [[Contract]] to
 *  be used most places an address can be, for example getting
 *  the [balance](Provider-getBalance).
 */
export interface Addressable {
  getAddress(): Promise<Address>;
}

export function isValidAddress(address: string): boolean {
  const cleaned = address.startsWith("0x") ? address.slice(2) : address;
  return /^[a-fA-F0-9]{40}$/.test(cleaned);
}
