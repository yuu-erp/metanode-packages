/**
 *  A [[HexString]] whose length is even, which ensures it is a valid
 *  representation of binary data.
 */
export type DataHexString = string;

/**
 *  An object that can be used to represent binary data.
 */
export type BytesLike = DataHexString | Uint8Array;

export function hexlify(value: BytesLike): string {
  if (typeof value === "string") {
    // validate hex string ở đây nếu muốn
    return value;
  }

  return (
    "0x" +
    Array.from(value)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}
