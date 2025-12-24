import { Middleware } from "../../domain/interfaces/middleware";
import { RateLimiterMemory } from "rate-limiter-flexible"; // Assume installed
import { RpcRequest } from "../../domain/types/rpc-request";
import { RpcResponse } from "../../domain/types/rpc-response";

export class RateLimitMiddleware implements Middleware {
  private limiter: RateLimiterMemory;

  constructor(points: number = 10, duration: number = 60) {
    this.limiter = new RateLimiterMemory({ points, duration });
  }

  processRequest<P = unknown>(req: RpcRequest<P>): RpcRequest<P> {
    // Consume point before send
    this.limiter.consume("global").catch(() => {
      throw new Error("Rate limit exceeded");
    });
    return req;
  }

  processResponse<R = unknown>(res: RpcResponse<R>): RpcResponse<R> {
    return res;
  }

  handleError(error: Error): void {
    // Optional: log error
  }
}
