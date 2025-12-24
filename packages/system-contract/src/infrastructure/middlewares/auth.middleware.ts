import { Middleware } from "../../domain/interfaces/middleware";
import { RpcRequest } from "../../domain/types/rpc-request";
import { RpcResponse } from "../../domain/types/rpc-response";

export class AuthMiddleware implements Middleware {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  processRequest<P = unknown>(req: RpcRequest<P>): RpcRequest<P> {
    // Add auth to params or headers; assume custom param
    (req.params as any).apiKey = this.apiKey;
    return req;
  }

  processResponse<R = unknown>(res: RpcResponse<R>): RpcResponse<R> {
    return res;
  }

  handleError(error: Error): void {
    // Handle auth errors specifically
    if (error.message.includes("unauthorized")) {
      throw new Error("Authentication failed");
    }
  }
}
