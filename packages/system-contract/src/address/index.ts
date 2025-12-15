/**
 *  An interface for objects which have an address, and can
 *  resolve it asyncronously.
 *
 *  This allows objects such as [[Signer]] or [[Contract]] to
 *  be used most places an address can be, for example getting
 *  the [balance](Provider-getBalance).
 */
export interface Addressable {
  /**
   *  Get the object address.
   */
  getAddress(): Promise<string>;
}
