// import { ChunkReceiver } from "../chunk/chunk-receiver";
// import { RequestMessage, ResponseMessage, TransportMessage } from "../types/message";
// import { Logger } from "../utils/logger";
// import { ITransportInterface } from "./transport.interface";
// import { InternalServerErrorException } from "@metanodejs/exceptions";

// export class PostMessageTransport implements ITransportInterface {
//   private readonly chunkReceiver: ChunkReceiver;
//   private readonly logger: Logger;

//   constructor(isDebug = false) {
//     this.logger = new Logger({ enabled: isDebug, prefix: "PostMessageTransport" });
//     this.chunkReceiver = new ChunkReceiver(this.logger);
//   }

//   send<T = unknown>(request: RequestMessage<T>): void {
//     if (!window?.postMessage) {
//       throw new InternalServerErrorException("Window is not available or not properly initialized");
//     }

//     window.postMessage(JSON.stringify(request), "*");
//     this.logger.debug("Message sent via postMessage", request);
//   }

//   onMessage<T>(callback: (msg: ResponseMessage<T>) => void): void {
//     window.addEventListener("message", (event: MessageEvent) => {
//       try {
//         // Normalize dữ liệu nhận được
//         const normalized = this.normalizeMessage(event.data);
//         if (!normalized) return;

//         // Gửi chunk qua receiver để ghép message
//         const assembled = this.chunkReceiver.receiveChunk(normalized);
//         if (assembled) {
//           this.logger.debug("Assembled full message", assembled);
//           callback(JSON.parse(assembled.data));
//         }
//       } catch (err) {
//         this.logger.error("Error handling postMessage event", err);
//       }
//     });
//   }

//   private normalizeMessage(data: unknown): TransportMessage | null {
//     try {
//       const parsed = typeof data === "string" ? JSON.parse(data) : data;
//       if (parsed && typeof parsed === "object" && "messageId" in parsed) {
//         return parsed as TransportMessage;
//       }
//       this.logger.warn("Invalid message format received", data);
//       return null;
//     } catch (err) {
//       this.logger.error("Failed to parse incoming message", err);
//       return null;
//     }
//   }
// }
export {};
