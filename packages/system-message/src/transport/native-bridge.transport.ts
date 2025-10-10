import { InternalServerErrorException } from "@metanodejs/exceptions";
import { ChunkReceiver } from "../chunk/chunk-receiver";
import { Webkit } from "../types/env";
import { ResponseMessage, TransportMessage } from "../types/message";
import { Logger } from "../utils/logger";
import { BaseTransport } from "./base.transport";

export class NativeBridgeTransport implements BaseTransport {
  private readonly chunkReceiver: ChunkReceiver;
  private readonly logger: Logger;
  private readonly webkit: Webkit | undefined;

  constructor(isDebug: boolean = false) {
    this.logger = new Logger({ enabled: isDebug, prefix: "NativeBridgeTransport" });
    this.chunkReceiver = new ChunkReceiver(this.logger);
    this.webkit = this.getWebkit();
  }

  send(request: TransportMessage): void {
    if (!this.webkit)
      throw new InternalServerErrorException("Webkit is not available or not properly initialized");
    this.webkit.messageHandlers.callbackHandler.postMessage(JSON.stringify(request));
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

  private getWebkit(): Webkit | undefined {
    if (
      typeof window === "undefined" ||
      typeof window.webkit === "undefined" ||
      typeof window.webkit.messageHandlers === "function" ||
      typeof window.webkit.messageHandlers.callbackHandler === "function" ||
      typeof window.webkit.messageHandlers.callbackHandler.postMessage !== "function"
    ) {
      return undefined;
    }
    return window.webkit;
  }
}
