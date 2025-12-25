export function hexToNumber(hex: string): number {
  return parseInt(hex, 16);
}

export function hexToBigInt(hex: string): bigint {
  return BigInt(hex);
}

export function numberToHex(value: number | bigint): string {
  return "0x" + value.toString(16);
}
