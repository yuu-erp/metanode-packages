import { ChunkSender } from "../chunk";
import { ITransportInterface } from "../transport";
import { RequestMessage } from "../types/message";
import { Logger } from "../utils/logger";

export interface SystemMessageOptions {
  isDebug?: boolean;
  timeout?: number;
  maxChunkSize?: number;
}

const defaultOptions: Required<SystemMessageOptions> = {
  isDebug: false,
  timeout: 15_000, // 15s default
  maxChunkSize: 64 * 1024, // 64KB mỗi chunk
};

export class SystemMessage {
  private readonly transport: ITransportInterface;
  private readonly logger: Logger;
  private readonly options: Required<SystemMessageOptions>;
  private readonly chunkSender: ChunkSender;
  constructor(transport: ITransportInterface, options?: SystemMessageOptions) {
    this.transport = transport;
    // merge default với user options
    this.options = { ...defaultOptions, ...options };
    this.logger = new Logger({
      enabled: this.options.isDebug,
      prefix: "SystemMessage",
    });
    this.chunkSender = new ChunkSender(this.logger, { maxChunkSize: this.options.maxChunkSize });
    this.logger.debug("SystemMessage initialized", this.options);
  }

  /**
   * Gửi message qua transport.
   * Nếu payload lớn hơn maxChunkSize → chia nhỏ ra từng chunk.
   */
  public send<T = unknown>(request: RequestMessage<T>) {
    const chunks = this.chunkSender.splitIfNeeded(request);

    if (Array.isArray(chunks)) {
      this.logger.debug(
        `✂️ Message ${request.messageId} quá lớn — chia thành ${chunks.length} chunk`,
      );
      for (const chunk of chunks) {
        this.transport.send(chunk);
      }
    } else {
      // message nhỏ — gửi luôn
      this.logger.debug(`📤 Sent normal message ${request.messageId}`);
      this.transport.send(chunks);
    }
  }

  public on(callback: (event: RequestMessage) => void): void {
    this.transport.onMessage(callback);
  }

  public get config() {
    return this.options;
  }
}
