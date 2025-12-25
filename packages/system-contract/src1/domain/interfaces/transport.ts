// src/domain/interfaces/Transport.ts

import { RpcRequest } from "../types/rpc-request";
import { RpcResponse } from "../types/rpc-response";

export interface Transport {
  /**
   * Establish connection to a node.
   * @param nodeUrl URL or endpoint for the node.
   * @returns Promise resolving when connected.
   */
  connect(nodeUrl: string): Promise<void>;

  /**
   * Send an RPC request over the transport.
   * @param req The RPC request.
   * @param nodeUrl Optional override for node.
   * @returns Promise with RPC response.
   */
  send<P = unknown, R = unknown>(req: RpcRequest<P>, nodeUrl?: string): Promise<RpcResponse<R>>;

  /**
   * Subscribe to events over the transport (for WS/TCP).
   * @param event Event to subscribe to.
   * @param callback Handler for data.
   * @returns Unsubscribe function.
   */
  subscribe<D = unknown>(event: string, callback: (data: D) => void): () => void;

  /**
   * Disconnect from the current node.
   * @returns Promise resolving when disconnected.
   */
  disconnect(): Promise<void>;

  /**
   * Check if transport is connected.
   * @returns Boolean indicating connection status.
   */
  isConnected(): boolean;
}
