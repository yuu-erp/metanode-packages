import { RpcRequest } from "../types/rpc-request";
import { RpcResponse } from "../types/rpc-response";

export interface Middleware {
  /**
   * Process incoming request before sending.
   * @param req The request to modify/process.
   * @returns Modified request or original.
   */
  processRequest<P = unknown>(req: RpcRequest<P>): RpcRequest<P>;

  /**
   * Process response after receiving.
   * @param res The response to modify/process.
   * @returns Modified response or original.
   */
  processResponse<R = unknown>(res: RpcResponse<R>): RpcResponse<R>;

  /**
   * Handle errors during request/response.
   * @param error The error thrown.
   * @returns Optionally rethrow or handle.
   */
  handleError(error: Error): void;
}
