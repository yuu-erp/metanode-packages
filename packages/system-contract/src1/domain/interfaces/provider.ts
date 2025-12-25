import { ChainConfig } from "../types/chain-config";
import { RpcRequest } from "../types/rpc-request";
import { RpcResponse } from "../types/rpc-response";
import { Middleware } from "./middleware";

export interface Provider<ChainType = unknown> {
  /**
   * Initialize provider with chain config and optional middlewares.
   * @param config Chain-specific configuration.
   * @param middleâwares Array of middlewares to apply.
   */
  initialize(config: ChainConfig, middlewares?: Middleware[]): void;

  /**
   * Send an RPC request, returning typed response.
   * Handles internal logic like retry, timeout, failover.
   * @param req The RPC request object.
   * @returns Promise resolving to the RPC response.
   * @throws Typed errors like RpcTimeoutError, RpcConnectionError.
   */
  request<P = unknown, R = unknown>(req: RpcRequest<P>): Promise<RpcResponse<R>>;

  /**
   * Subscribe to chain events (e.g., new blocks, logs).
   * Transport-agnostic; implementation handles WS/TCP subscriptions.
   * @param event Event name (e.g., 'newHeads').
   * @param callback Function to handle incoming data.
   * @returns Unsubscribe function.
   */
  subscribe<D = unknown>(event: string, callback: (data: D) => void): () => void;

  /**
   * Dynamically add a middleware to the chain.
   * @param middleware The middleware to add.
   */
  addMiddleware(middleware: Middleware): void;

  /**
   * Get provider status, including connection health.
   * @returns Status object.
   */
  getStatus(): {
    connected: boolean;
    activeNode: string;
    nodeCount: number;
    transportType: string;
  };
}
