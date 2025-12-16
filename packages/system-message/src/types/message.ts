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
  /** Cho phép mở rộng thêm key-value tùy ý */
  [key: string]: any;
};
export type ResponseMessage<T = unknown> = Message & {
  data: T;
  success: boolean;
  message?: string;
  isSocket?: boolean;
};
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
  messageId: string;
}
export type TransportMessage = NormalMessage | LargeMessage;
