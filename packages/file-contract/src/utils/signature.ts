import { createHash, createSignECDH } from "@metanodejs/system-core";

/**
 * Generate signature for downloadKey
 * Logic matches Go code: hash = Keccak256Hash("0x00" + downloadKey bytes)
 */
export async function generateSignature(downloadKey: string, privateKey: string): Promise<string> {
  try {
    // Remove 0x prefix if present for consistent processing
    const cleanDownloadKey = downloadKey.startsWith("0x") ? downloadKey.slice(2) : downloadKey;

    // Create message with prefix "0x00" + downloadKey (matching Go: []byte("0x00") + messageBytes)
    // In Go: messageBytes = []byte(downloadKeyHex), so we concatenate "0x00" + downloadKey
    const messageWithPrefix = `0x00${cleanDownloadKey}`;

    // Hash the message with prefix (matching Go: crypto.Keccak256Hash([]byte("0x00"), messageBytes))
    // isHex: false because we're passing the full string "0x00" + hex, not treating it as hex
    const hash = await createHash(messageWithPrefix, false);

    // Sign the hash
    const { sign } = await createSignECDH({
      message: hash,
      privateKey,
      hash,
    });
    return sign;
  } catch (error) {
    console.error("Error generating signature:", error);
    throw new Error("Failed to generate signature for download key");
  }
}
