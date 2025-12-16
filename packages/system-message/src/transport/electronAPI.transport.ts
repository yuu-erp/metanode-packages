import { ChunkReceiver } from "../chunk/chunk-receiver";
import { ElectronAPI } from "../types/env";
import { TransportMessage, ResponseMessage } from "../types/message";
import { Logger } from "../utils/logger";
import { BaseTransport } from "./base.transport";
import { InternalServerErrorException } from "@metanodejs/exceptions";

const CHANNELS = {
  TO_NATIVE: "native",
  FROM_NATIVE: "fromNative",
} as const;

export class ElectronAPITransport implements BaseTransport {
  readonly source = "electron";

  private readonly chunkReceiver: ChunkReceiver;
  private readonly logger: Logger;
  private readonly electronAPI: ElectronAPI | undefined;
  constructor(isDebug: boolean = false) {
    this.logger = new Logger({ enabled: isDebug, prefix: "NativeBridgeTransport" });
    this.chunkReceiver = new ChunkReceiver(this.logger);
    this.electronAPI = this.getElectronAPI();
  }

  send(request: TransportMessage): void {
    if (!this.electronAPI)
      throw new InternalServerErrorException(
        "Electron API is not available or not properly initialized",
      );
    this.electronAPI.sendMessage(CHANNELS.TO_NATIVE, JSON.stringify(request));
  }

  onMessage(callback: (event: ResponseMessage) => void): void {
    if (!this.electronAPI) {
      console.warn("Electron API is not available, message listener not registered");
      return;
    }
    this.electronAPI.onMessage(CHANNELS.FROM_NATIVE, (event: MessageEvent) => {
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

  private getElectronAPI(): ElectronAPI | undefined {
    if (
      typeof window === "undefined" ||
      typeof window.electronAPI === "undefined" ||
      typeof window.electronAPI.sendMessage !== "function" ||
      typeof window.electronAPI.onMessage !== "function"
    ) {
      return undefined;
    }
    return window.electronAPI;
  }
}
