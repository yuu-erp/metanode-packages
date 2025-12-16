import { Logger } from "../utils/logger";
import { LargeMessage, NormalMessage, TransportMessage } from "../types/message";

interface ChunkReceiverOptions {
  /** Timeout tối đa để chờ nhận đủ tất cả chunk */
  timeout?: number;
}

const defaultOptions: Required<ChunkReceiverOptions> = {
  timeout: 15_000, // 15s
};

/**
 * ChunkReceiver - ghép các chunk lại thành message hoàn chỉnh
 * Dành cho các message kiểu "large"
 */
export class ChunkReceiver {
  private readonly logger: Logger;
  private readonly options: Required<ChunkReceiverOptions>;

  /**
   * Map lưu trữ các chunk tạm thời:
   * key = messageId
   * value = { totalChunks, receivedChunks, chunks[], timer }
   */
  private readonly chunkBuffer = new Map<
    string,
    {
      totalChunks: number;
      receivedChunks: number;
      chunks: string[];
      timer: NodeJS.Timeout;
    }
  >();

  constructor(logger: Logger, options?: ChunkReceiverOptions) {
    this.logger = logger;
    this.options = { ...defaultOptions, ...options };
  }

  /**
   * Nhận 1 chunk và tự động ghép khi đủ
   */
  public receiveChunk(message: TransportMessage): NormalMessage | null {
    if (!message.type || message.type !== "large") {
      // Không cần ghép, trả lại luôn
      return { type: "normal", data: JSON.stringify(message) };
    }

    const { command, chunk, index, totalChunks } = message as LargeMessage;
    const messageId = `${command}-${message.messageId}`; // hoặc thêm traceId vào nếu cần phân biệt nhiều message

    let buffer = this.chunkBuffer.get(messageId);
    if (!buffer) {
      buffer = {
        totalChunks,
        receivedChunks: 0,
        chunks: new Array(totalChunks),
        timer: setTimeout(() => {
          this.logger.warn(`Timeout assembling message ${messageId}`);
          this.chunkBuffer.delete(messageId);
        }, this.options.timeout),
      };
      this.chunkBuffer.set(messageId, buffer);
    }

    // Thêm chunk vào buffer
    buffer.chunks[index] = chunk;
    buffer.receivedChunks++;

    this.logger.debug(
      `[ChunkReceiver] Received chunk ${index + 1}/${totalChunks} for ${messageId}`,
    );

    // Khi đã đủ hết chunk
    if (buffer.receivedChunks === totalChunks) {
      clearTimeout(buffer.timer);
      this.chunkBuffer.delete(messageId);

      try {
        const combined = buffer.chunks.join("");
        this.logger.debug(`[ChunkReceiver] Message ${messageId} assembled successfully`);
        return { type: "normal", data: combined };
      } catch (err) {
        this.logger.error(`[ChunkReceiver] Failed to parse message ${messageId}`, err);
        return null;
      }
    }

    return null;
  }

  /**
   * Reset toàn bộ buffer (khi clear hoặc reload app)
   */
  public clear() {
    this.chunkBuffer.forEach((v) => clearTimeout(v.timer));
    this.chunkBuffer.clear();
  }
}
