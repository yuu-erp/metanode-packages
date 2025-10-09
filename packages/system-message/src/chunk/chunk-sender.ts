import { RequestMessage, TransportMessage } from "../types/message";
import { Logger } from "../utils/logger";

export interface ChunkSenderOptions {
  maxChunkSize: number;
}

/**
 * ChunkSender chịu trách nhiệm:
 * - Serialize payload lớn.
 * - Tách thành nhiều phần nhỏ không vượt quá maxChunkSize.
 * - Trả về mảng các ChunkEnvelope để gửi tuần tự qua transport.
 */
export class ChunkSender {
  private readonly maxChunkSize: number;

  constructor(
    private readonly logger: Logger,
    options: ChunkSenderOptions,
  ) {
    this.maxChunkSize = options.maxChunkSize;
  }

  /**
   * Chia payload nếu lớn hơn maxChunkSize.
   * Nếu nhỏ, trả về mảng 1 phần tử (normal message).
   */
  public splitIfNeeded<T = unknown>(
    request: RequestMessage<T>,
  ): TransportMessage | TransportMessage[] {
    const json = JSON.stringify(request);
    const size = new Blob([json]).size;

    if (size <= this.maxChunkSize) {
      this.logger?.debug(`[ChunkSender] Normal message, size=${size} bytes`);
      return {
        type: "normal",
        data: JSON.stringify(request),
      };
    }

    this.logger?.debug(`[ChunkSender] Large message detected, size=${size} bytes, splitting...`);

    const chunks = this.splitString(json, this.maxChunkSize);
    const totalChunks = chunks.length;

    const envelopes: TransportMessage[] = chunks.map((chunk, index) => ({
      type: "large",
      messageId: request.messageId,
      command: request.command,
      index,
      totalChunks,
      chunk,
    }));

    this.logger?.debug(
      `[ChunkSender] Created ${totalChunks} chunks for messageId=${request.messageId}`,
    );

    return envelopes;
  }

  /**
   * Helper: cắt string thành từng đoạn có độ dài <= maxChunkSize
   */
  private splitString(input: string, maxSize: number): string[] {
    const result: string[] = [];
    for (let i = 0; i < input.length; i += maxSize) {
      result.push(input.slice(i, i + maxSize));
    }
    return result;
  }
}
