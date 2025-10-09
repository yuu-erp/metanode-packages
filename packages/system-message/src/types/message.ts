export interface MessageMetadata {
  /** Nguồn gửi message, ví dụ: 'iframe', 'native', 'webview', 'worker' */
  source?: string;

  /** Nguồn nhận message, ví dụ: 'host', 'parent', 'native' */
  target?: string;

  /** Origin cho môi trường web: https://example.com */
  origin?: string;

  /** Dấu thời gian khi gửi message (ms) */
  timestamp?: number;

  /** Mã định danh trace để debug hoặc logging xuyên suốt hệ thống */
  traceId?: string;

  /** Tuỳ chọn, chứa thông tin bảo mật hoặc session */
  token?: string;

  /** Custom key-value, mở rộng cho adapter riêng */
  [key: string]: any;
}
export type Message = {
  messageId: string;
  command: string;
  metadata?: MessageMetadata;
};
export type RequestMessage<T = unknown> = Message & {
  value?: T;
};
export type ResponseMessage<T = unknown> = Message & {
  data: T;
  success: boolean;
};
export type MessageEnvelope<T = unknown> = RequestMessage<T> | ResponseMessage<T>;
export interface NormalMessage {
  type: "normal";
  data: string;
}
export interface LargeMessage {
  type: "large";
  chunk: string;
  index: number;
  totalChunks: number;
  command: string;
}
export type TransportMessage = NormalMessage | LargeMessage;
/**
 * Mỗi chunk có type = "large"
 * và chứa metadata để ghép lại ở phía receiver.
 */
export interface ChunkEnvelope {
  type: "large";
  messageId: string;
  index: number;
  totalChunks: number;
  command: string;
  chunk: string; // stringified partial data
}
