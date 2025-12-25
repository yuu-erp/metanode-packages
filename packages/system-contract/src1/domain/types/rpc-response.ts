export interface RpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface RpcResponse<R = unknown> {
  jsonrpc: "2.0";
  result?: R;
  error?: RpcError;
  id: number | string;
}
