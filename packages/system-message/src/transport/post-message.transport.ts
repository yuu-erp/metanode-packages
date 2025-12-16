import { ChunkReceiver } from "../chunk/chunk-receiver";
import { ResponseMessage, TransportMessage } from "../types/message";
import { Logger } from "../utils/logger";
import { BaseTransport } from "./base.transport";

export class PostMessageTransport implements BaseTransport {
  readonly source = "postmessage";
  private readonly chunkReceiver: ChunkReceiver;
  private readonly logger: Logger;
  private readonly targetWindow: Window;
  private readonly origin: string;

  constructor(targetWindow: Window, origin: string = "*", isDebug: boolean = false) {
    this.logger = new Logger({ enabled: isDebug, prefix: "PostMessageTransport" });
    this.chunkReceiver = new ChunkReceiver(this.logger);
    this.targetWindow = targetWindow;
    this.origin = origin;
  }

  send(request: TransportMessage): void {
    const payload = JSON.stringify(request);
    this.targetWindow.postMessage(payload, this.origin);
  }

  onMessage(callback: (event: ResponseMessage) => void): void {
    window.addEventListener("message", (event: MessageEvent) => {
      try {
        this.logger.debug("📥 Received message: ", event.data);
        const rawData = event.data;
        const parsed = JSON.parse(rawData) as TransportMessage;
        const assembled = this.chunkReceiver.receiveChunk(parsed);
        if (assembled) {
          this.logger.debug("📥 Received and assembled message", assembled.data);
          callback(JSON.parse(assembled.data));
        }
      } catch (error) {
        this.logger.error("❌ Error parsing event bus message", error);
      }
    });
  }
}
