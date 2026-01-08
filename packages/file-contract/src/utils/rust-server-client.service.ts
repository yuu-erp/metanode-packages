/**
 * Rust Server Client
 *
 * Kết nối và request chunks từ Rust Servers sử dụng Native QUIC Connection
 *
 * Implementation sử dụng native functions:
 * - connectQuicServer: Connect đến Rust server
 * - sendQuicMessage: Gửi message và nhận response
 * - disconnectQuicServer: Disconnect khi không dùng nữa
 * - Load Balancing: Chunk chẵn từ Server 1, chunk lẻ từ Server 2
 * - Retry logic khi request fail (max 3 lần)
 * - Không retry nếu lỗi chứa "to store chunk on disk" (đã thành công)
 */

import { sendCommand } from "@metanodejs/system-core";
import { FileContract } from "../contract";

export const sendQuicMessage = async (ip: string, port: number, alpn: string, payload: string) =>
  await sendCommand("sendQuicMessage", { ip, port, alpn, payload });
export const connectQuicServer = async (ip: string, port: number, alpn: string) =>
  await sendCommand("connectQuicServer", { ip, port, alpn });

export const disconnectQuicServer = async (ip: string, port: number, alpn: string) =>
  await sendCommand("disconnectQuicServer", { ip, port, alpn });

const fileContract = new FileContract();
// ALPN protocol
const ALPN = "file-storage-v1";

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 200;

// Request/Response types
export interface DownloadChunkPayload {
  file_key: string;
  download_key: string;
  chunk_index: number;
  signature: string;
}

export interface DownloadChunkRequest {
  command: string;
  payload: DownloadChunkPayload;
}

export interface DownloadResponse {
  status: string;
  message: string;
  chunk_data_base64?: string;
}

/**
 * Parse IP và port từ address string (format: "ip:port")
 */
function parseServerAddress(address: string): { ip: string; port: number } {
  const [ip, portStr] = address.split(":");
  if (!ip || !portStr) {
    throw new Error(`Invalid server address format: ${address}`);
  }
  const port = parseInt(portStr, 10);
  if (isNaN(port)) {
    throw new Error(`Invalid port in address: ${address}`);
  }
  return { ip, port };
}

/**
 * Connect đến server
 * Native sẽ tự quản lý connection, có thể gọi nhiều lần
 */
async function ensureConnected(serverAddr: string): Promise<void> {
  const { ip, port } = parseServerAddress(serverAddr);
  await connectQuicServer(ip, port, ALPN);
  console.log(`[Server ${serverAddr}] Connected via QUIC`);
}

/**
 * Disconnect từ server
 */
async function disconnectServer(serverAddr: string): Promise<void> {
  const { ip, port } = parseServerAddress(serverAddr);
  try {
    await disconnectQuicServer(ip, port, ALPN);
    console.log(`[Server ${serverAddr}] Disconnected`);
  } catch (error) {
    console.warn(`[Server ${serverAddr}] Disconnect error:`, error);
    // Ignore disconnect errors
  }
}

/**
 * Request chunk từ server sử dụng native QUIC
 * Note: Server phải đã được connect trước đó (trong downloadAllChunks)
 */
async function requestChunkFromServer(
  serverAddr: string,
  fileKey: string,
  downloadKey: string,
  chunkIndex: number,
  signature: string,
): Promise<Uint8Array> {
  const { ip, port } = parseServerAddress(serverAddr);

  // Tạo request payload
  const request: DownloadChunkRequest = {
    command: "DownloadChunkRequest",
    payload: {
      file_key: fileKey,
      download_key: downloadKey,
      chunk_index: chunkIndex,
      signature: signature,
    },
  };

  const requestMessage = JSON.stringify(request) + "\n";

  const response = await sendQuicMessage(ip, port, ALPN, requestMessage);

  console.log("response----", response);

  // Parse response - có thể là object hoặc string JSON
  let data: DownloadResponse;
  try {
    if (typeof response === "string") {
      data = JSON.parse(response);
    } else if (typeof response === "object" && response !== null) {
      data = response as DownloadResponse;
    } else {
      throw new Error(`Invalid response type: ${typeof response}`);
    }
  } catch (parseError) {
    throw new Error(`Failed to parse server response: ${JSON.stringify(response)}`);
  }

  if (data.status !== "SUCCESS") {
    const errorMessage = data.message || "Unknown error";
    throw new Error(errorMessage);
  }

  if (!data.chunk_data_base64) {
    throw new Error("No chunk data in response");
  }

  const base64Data = data.chunk_data_base64;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

/**
 * Lấy server addresses từ blockchain (fetch mới mỗi lần)
 * @throws Error nếu không lấy được hoặc không đủ 2 servers
 */
async function getServerAddresses(from: string, to: string): Promise<string[]> {
  try {
    console.log("getServerAddresses", { from, to });
    const addresses = await fileContract.getRustServerAddresses(from, to);

    if (!addresses || addresses.length === 0) {
      throw new Error("No Rust server addresses found on blockchain");
    }

    if (addresses.length < 2) {
      throw new Error(`Insufficient Rust servers: found ${addresses.length}, need at least 2`);
    }

    console.log("Server addresses from blockchain:", addresses);
    return addresses;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get Rust server addresses from blockchain: ${errorMessage}`);
  }
}

/**
 * Determine which server to use based on chunk index
 * Chẵn → Server 1, Lẻ → Server 2
 */
function getServerForChunk(chunkIndex: number, serverAddresses: string[]): string {
  const serverIndex = chunkIndex % 2;
  if (!serverAddresses[serverIndex]) {
    throw new Error(`Server address not found for chunk index ${chunkIndex}`);
  }
  return serverAddresses[serverIndex]!;
}

/**
 * Request chunk với automatic server selection và retry logic
 */
export async function requestChunk(
  fileKey: string,
  downloadKey: string,
  chunkIndex: number,
  signature: string,
  serverAddresses: string[],
): Promise<{ chunkIndex: number; data: Uint8Array }> {
  const serverAddr = getServerForChunk(chunkIndex, serverAddresses);
  const isEven = chunkIndex % 2 === 0;

  console.log(
    `[Chunk ${chunkIndex}] Requesting from ${isEven ? "Server 1" : "Server 2"} (${serverAddr})`,
  );

  // Retry logic cho request (giống Go code)
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const data = await requestChunkFromServer(
        serverAddr,
        fileKey,
        downloadKey,
        chunkIndex,
        signature,
      );
      return { chunkIndex, data };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorMessage = lastError.message.toLowerCase();

      // Không retry nếu lỗi chứa "to store chunk on disk" (đã thành công)
      if (errorMessage.includes("to store chunk on disk")) {
        console.log(`[Chunk ${chunkIndex}] Success (stored on disk), no retry needed`);
        throw lastError;
      }

      console.warn(
        `[Chunk ${chunkIndex}] Request attempt ${attempt + 1}/${MAX_RETRIES} failed:`,
        lastError.message,
      );

      if (attempt < MAX_RETRIES - 1) {
        // Delay trước khi retry
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  // Tất cả retry đều thất bại
  throw new Error(
    `[Chunk ${chunkIndex}] Request failed sau ${MAX_RETRIES} lần thử: ${lastError?.message}`,
  );
}

/**
 * Download all chunks in parallel with sharding optimization
 *
 * Chia chunks thành 2 nhóm (chẵn/lẻ) và download song song
 * - Chunks chẵn (0, 2, 4...) → Server 1
 * - Chunks lẻ (1, 3, 5...) → Server 2
 * - Tương tự Go code với Goroutines
 *
 * @param fileKey - File key
 * @param downloadKey - Download key from event
 * @param totalChunks - Total number of chunks
 * @param signature - Signature for authentication
 * @param onProgress - Callback for progress updates
 * @returns Array of chunks in correct order
 */
export async function downloadAllChunks(
  fileKey: string,
  downloadKey: string,
  totalChunks: number,
  signature: string,
  from: string,
  to: string,
  onProgress?: (downloaded: number, total: number) => void,
): Promise<Uint8Array[]> {
  console.log(`Starting download of ${totalChunks} chunks...`, { from, to });

  // Lấy server addresses từ blockchain
  const serverAddresses = await getServerAddresses(from, to);
  if (serverAddresses.length < 2) {
    throw new Error("Need at least 2 server addresses to download chunks");
  }

  const server1Addr = serverAddresses[0]!;
  const server2Addr = serverAddresses[1]!;

  console.log(`Using servers: ${server1Addr}, ${server2Addr}`);

  // Connect đến cả 2 servers trước
  await Promise.all([ensureConnected(server1Addr), ensureConnected(server2Addr)]);

  const chunkIndices = Array.from({ length: totalChunks }, (_, i) => i);

  // Chia thành 2 nhóm: chẵn và lẻ
  const evenChunks = chunkIndices.filter((i) => i % 2 === 0); // Server 1
  const oddChunks = chunkIndices.filter((i) => i % 2 === 1); // Server 2

  console.log(`Even chunks (Server 1): ${evenChunks.length}`);
  console.log(`Odd chunks (Server 2): ${oddChunks.length}`);

  // Download cả 2 nhóm song song (tương tự Go code với Goroutines)
  const [evenResults, oddResults] = await Promise.all([
    // Download chunks chẵn từ Server 1 (song song)
    Promise.all(
      evenChunks.map((chunkIndex) =>
        requestChunk(fileKey, downloadKey, chunkIndex, signature, serverAddresses),
      ),
    ),
    // Download chunks lẻ từ Server 2 (song song)
    Promise.all(
      oddChunks.map((chunkIndex) =>
        requestChunk(fileKey, downloadKey, chunkIndex, signature, serverAddresses),
      ),
    ),
  ]);

  // Merge results và sort theo chunkIndex
  const allResults = [...evenResults, ...oddResults].sort((a, b) => a.chunkIndex - b.chunkIndex);

  // Extract data và maintain order
  const chunks = allResults.map((result) => result.data);

  // Call progress callback
  if (onProgress) {
    onProgress(chunks.length, totalChunks);
  }

  console.log(`Downloaded all ${chunks.length} chunks successfully`);

  // Disconnect sau khi download xong
  await Promise.all([disconnectServer(server1Addr), disconnectServer(server2Addr)]);

  return chunks;
}

/**
 * Download all chunks and merge into single file
 *
 * @param fileKey - File key
 * @param downloadKey - Download key from event
 * @param totalChunks - Total number of chunks
 * @param signature - Signature for authentication
 * @param onProgress - Callback for progress updates
 * @returns Merged file as Uint8Array
 */
export async function downloadAndMergeFile(
  fileKey: string,
  downloadKey: string,
  totalChunks: number,
  signature: string,
  from: string,
  to: string,
  onProgress?: (downloaded: number, total: number) => void,
): Promise<Uint8Array> {
  const chunks = await downloadAllChunks(
    fileKey,
    downloadKey,
    totalChunks,
    signature,
    from,
    to,
    onProgress,
  );

  // Merge all chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);

  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  console.log(`Merged file size: ${merged.length} bytes`);

  return merged;
}
