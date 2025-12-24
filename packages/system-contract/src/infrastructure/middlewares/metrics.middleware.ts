import promClient from "prom-client"; // Assume Prometheus client installed
import { Middleware } from "../../domain/interfaces/middleware";
import { RpcRequest } from "../../domain/types/rpc-request";
import { RpcResponse } from "../../domain/types/rpc-response";

const rpcRequestsTotal = new promClient.Counter({
  name: "rpc_requests_total",
  help: "Total number of RPC requests",
  labelNames: ["method", "status"],
});

export class MetricsMiddleware implements Middleware {
  processRequest<P = unknown>(req: RpcRequest<P>): RpcRequest<P> {
    return req;
  }

  processResponse<R = unknown>(res: RpcResponse<R>): RpcResponse<R> {
    const status = res.error ? "error" : "success";
    rpcRequestsTotal.inc({ method: res.id.toString(), status });
    return res;
  }

  handleError(error: Error): void {
    // Increment error metric
  }
}
