import type { ResponseMessage, TransportMessage } from "../types/message";

export interface BaseTransport {
  /** Nguồn gửi message: 'native', 'electron', 'postmessage', v.v. */
  readonly source: string;

  /** Gửi message đi */
  send(request: TransportMessage): void;

  /** Lắng nghe message nhận về */
  onMessage(callback: (event: ResponseMessage) => void): void;

  // Optional: nếu cần off listener hoặc destroy
  // offMessage?(callback: (event: ResponseMessage) => void): void;
  // destroy?(): void;
}
