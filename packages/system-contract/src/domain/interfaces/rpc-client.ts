// src/domain/interfaces/RpcClient.ts

import { RpcRequest } from "../types/rpc-request";
import { RpcResponse } from "../types/rpc-response";
import { Transport } from "./transport";

export interface RpcClient {
  /**
   * The underlying transport used by the client.
   */
  readonly transport: Transport;

  /**
   * Send a single RPC request.
   * @param req The request to send.
   * @returns Promise with response.
   */
  send<P = unknown, R = unknown>(req: RpcRequest<P>): Promise<RpcResponse<R>>;

  /**
   * Batch send multiple RPC requests.
   * @param reqs Array of requests.
   * @returns Promise with array of responses.
   */
  batchSend(reqs: RpcRequest[]): Promise<RpcResponse[]>;

  /**
   * Validate RPC method availability for the chain.
   * @param method The method to check.
   * @returns Boolean if supported.
   */
  isMethodSupported(method: string): boolean;
}
