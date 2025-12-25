import { Middleware } from "../domain/interfaces/middleware";
import { Provider } from "../domain/interfaces/provider";
import { Transport } from "../domain/interfaces/transport";
import { ChainConfig } from "../domain/types/chain-config";
import { RpcRequest } from "../domain/types/rpc-request";
import { RpcResponse } from "../domain/types/rpc-response";
import { MiddlewareChain } from "./middleware-chain";
import { FailoverPool } from "./utils/failover-pool";
import { LoggerTracer } from "./utils/logger-tracer";
import { RetryHandler } from "./utils/retry-handler";
import { TimeoutHandler } from "./utils/timeout-handler";

export class ProviderService<ChainType = unknown> implements Provider<ChainType> {
  private transport: Transport;
  private failoverPool: FailoverPool;
  private retryHandler: RetryHandler;
  private timeoutHandler: TimeoutHandler;
  private middlewareChain: MiddlewareChain;
  private logger: LoggerTracer;

  constructor(transport: Transport) {
    this.transport = transport;
    this.failoverPool = new FailoverPool();
    this.retryHandler = new RetryHandler();
    this.timeoutHandler = new TimeoutHandler();
    this.middlewareChain = new MiddlewareChain();
    this.logger = new LoggerTracer({ service: "ProviderService" });
  }

  initialize(config: ChainConfig, middlewares: Middleware[] = []): void {
    this.failoverPool.initialize(config.nodes);
    this.retryHandler.configure({
      maxRetries: config.retryCount ?? 5,
      baseDelayMs: 500,
      backoffFactor: config.backoffFactor ?? 2,
    });
    this.timeoutHandler.configure({
      timeoutMs: config.timeoutMs ?? 30000,
    });

    middlewares.forEach((m) => this.middlewareChain.add(m));
    this.logger.info("ProviderService initialized", {
      chain: config.name,
      nodes: config.nodes.length,
    });
  }

  async request<P = unknown, R = unknown>(req: RpcRequest<P>): Promise<RpcResponse<R>> {
    const correlationId = crypto.randomUUID();
    const span = this.logger.startSpan("rpc.request", {
      method: req.method,
      correlationId,
    });

    try {
      // 1. Apply middleware chain on request
      let processedReq = this.middlewareChain.processRequest(req);

      // 2. Execute with retry + timeout + failover
      const response = await this.retryHandler.execute(async () => {
        const node = this.failoverPool.getNextHealthyNode();

        return this.timeoutHandler.execute(async () => {
          this.logger.debug(`Sending request to ${node.url}`, { method: req.method });

          const rawResponse = await this.transport.send(processedReq, node.url);

          // 3. Apply middleware on response
          return this.middlewareChain.processResponse(rawResponse) as RpcResponse<R>;
        });
      });

      span.end({ success: true });
      return response;
    } catch (error) {
      span.end({ error });
      this.logger.error("RPC request failed", { error, method: req.method, correlationId });
      throw error;
    }
  }

  subscribe<D = unknown>(event: string, callback: (data: D) => void): () => void {
    // Subscription chỉ khả dụng khi transport hỗ trợ (WS/TCP)
    if (!this.transport.subscribe) {
      throw new Error("Current transport does not support subscriptions");
    }

    return this.transport.subscribe(event, (data: D) => {
      try {
        const processed = this.middlewareChain.processResponse({ result: data } as any);
        callback(processed.result as D);
      } catch (err) {
        this.logger.error("Subscription callback error", { event, error: err });
      }
    });
  }

  addMiddleware(middleware: Middleware): void {
    this.middlewareChain.add(middleware);
  }

  getStatus(): {
    connected: boolean;
    activeNode: string;
    nodeCount: number;
    transportType: string;
  } {
    const active = this.failoverPool.getActiveNode();
    return {
      connected: this.transport.isConnected(),
      activeNode: active?.url ?? "none",
      nodeCount: this.failoverPool.getNodeCount(),
      transportType: active?.transportType ?? "unknown",
    };
  }
}
