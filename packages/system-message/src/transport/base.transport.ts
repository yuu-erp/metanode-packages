import type { ResponseMessage, TransportMessage } from "../types/message";

export interface BaseTransport {
  send(request: TransportMessage): void;
  onMessage(callback: (event: ResponseMessage) => void): void;
}
