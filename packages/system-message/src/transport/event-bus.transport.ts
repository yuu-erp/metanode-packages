import { ChunkReceiver } from "../chunk/chunk-receiver";
import { ResponseMessage, TransportMessage } from "../types/message";
import { SimpleEventBus } from "../utils/event-bus";
import { Logger } from "../utils/logger";
import { ITransportInterface } from "./transport.interface";

/**
 * Mô phỏng một môi trường message transport (giống postMessage)
 * nhưng dùng EventBus nội bộ.
 */
export class EventBusTransport implements ITransportInterface {
  private static bus = new SimpleEventBus();
  private readonly chunkReceiver: ChunkReceiver;
  private readonly logger: Logger;

  constructor(
    private readonly channel = "system-message",
    isDebug = false,
  ) {
    this.logger = new Logger({ enabled: isDebug, prefix: "EventBusTransport" });
    this.chunkReceiver = new ChunkReceiver(this.logger);
  }

  send(request: TransportMessage): void {
    const payload = JSON.stringify(request);
    EventBusTransport.bus.emit(this.channel, payload);
  }

  onMessage<T>(callback: (msg: ResponseMessage<T>) => void): void {
    EventBusTransport.bus.on(this.channel, (rawData: string) => {
      try {
        this.logger.debug("📥 Received message: ", rawData);
        const parsed = JSON.parse(rawData);
        const assembled = this.chunkReceiver.receiveChunk(parsed);
        if (assembled) {
          this.logger.debug("📥 Received and assembled message", assembled.data);
          callback(JSON.parse(assembled.data));
        }
      } catch (err) {
        this.logger.error("❌ Error parsing event bus message", err);
      }
    });
  }
}
