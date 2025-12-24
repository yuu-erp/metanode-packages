import { Middleware } from "../domain/interfaces/middleware";
import { RpcRequest } from "../domain/types/rpc-request";
import { RpcResponse } from "../domain/types/rpc-response";

export class MiddlewareChain {
  private middlewares: Middleware[] = [];

  add(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  processRequest<P = unknown>(request: RpcRequest<P>): RpcRequest<P> {
    return this.middlewares.reduce((req, mw) => {
      try {
        return mw.processRequest(req);
      } catch (err) {
        console.warn("Middleware request processing failed", {
          middleware: mw.constructor.name,
          error: err,
        });
        return req;
      }
    }, request);
  }

  processResponse<R = unknown>(response: RpcResponse<R>): RpcResponse<R> {
    return this.middlewares.reduceRight((res, mw) => {
      try {
        return mw.processResponse(res);
      } catch (err) {
        console.warn("Middleware response processing failed", {
          middleware: mw.constructor.name,
          error: err,
        });
        return res;
      }
    }, response);
  }
}
