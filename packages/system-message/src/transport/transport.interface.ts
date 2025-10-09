import type { ResponseMessage, TransportMessage } from "../types/message";

export interface ITransportInterface {
  send(request: TransportMessage): void;
  onMessage<T = unknown>(callback: (event: ResponseMessage<T>) => void): void;
}
