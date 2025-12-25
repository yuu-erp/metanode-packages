export interface RpcRequest<P = unknown> {
  jsonrpc: string;
  method: string;
  params: P;
  id: number | string;
}
