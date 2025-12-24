# @metanodejs/system-contract

src/
├── domain/
│ ├── interfaces/
│ │ ├── Provider.ts
│ │ ├── Transport.ts
│ │ ├── RpcClient.ts
│ │ └── Middleware.ts
│ └── types/
│ ├── RpcRequest.ts
│ ├── RpcResponse.ts
│ └── ChainConfig.ts
├── application/
│ ├── ProviderService.ts // Core logic: retry, timeout, failover
│ ├── MiddlewareChain.ts // Builder for middleware stack
│ └── utils/
│ ├── RetryHandler.ts
│ ├── TimeoutHandler.ts
│ ├── ReconnectHandler.ts
│ ├── FailoverPool.ts
│ └── LoggerTracer.ts // Integrate with winston/opentelemetry
├── infrastructure/
│ ├── transports/
│ │ ├── HttpJsonRpcTransport.ts
│ │ ├── WebSocketTransport.ts
│ │ └── TcpCustomTransport.ts // Custom protocol impl
│ ├── clients/
│ │ └── RpcClientImpl.ts // Generic RPC sender
│ └── middlewares/
│ ├── RateLimitMiddleware.ts
│ ├── MetricsMiddleware.ts // e.g., Prometheus
│ └── AuthMiddleware.ts
├── config/
│ └── chains/
│ ├── evmChainConfig.ts // Extendable for other chains
└── index.ts // Exports: Provider factory
