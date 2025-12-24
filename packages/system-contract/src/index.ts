import { ProviderService } from "./application/provider.service";
import { ChainConfig } from "./domain/types/chain-config";
import { AuthMiddleware } from "./infrastructure/middlewares/auth.middleware";
import { RateLimitMiddleware } from "./infrastructure/middlewares/rate-limit.middleware";
import { HttpJsonRpcTransport } from "./infrastructure/transports/http-json-rpc.transport";

// Config ví dụ
const evmConfig: ChainConfig = {
  chainId: 1,
  name: "Ethereum",
  nodes: [
    { url: "https://rpc.example.com", transportType: "http", priority: 10 },
    { url: "wss://ws.example.com", transportType: "ws", priority: 5 },
  ],
  rpcMethods: ["eth_getBalance", "eth_sendTransaction"],
  timeoutMs: 20000,
  retryCount: 3,
  backoffFactor: 1.5,
};

// Khởi tạo Transport (infrastructure)
const transport = new HttpJsonRpcTransport(); // Có thể swap sang WebSocketTransport

// Khởi tạo ProviderService (application, implement Provider interface từ domain)
const provider = new ProviderService(transport);

// Initialize với middleware (infrastructure)
const rateLimiter = new RateLimitMiddleware(5, 60); // 5 req/min
provider.initialize(evmConfig, [rateLimiter]);

// Ví dụ gọi request (Wallet/Contract sẽ gọi như thế này)
async function exampleRequest() {
  const req = {
    jsonrpc: "2.0",
    method: "eth_getBalance",
    params: ["0xAddress", "latest"],
    id: 1,
  };

  try {
    const response = await provider.request(req);
    console.log("Response:", response.result);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Subscribe ví dụ (nếu dùng WS transport)
function exampleSubscribe() {
  const unsubscribe = provider.subscribe("newHeads", (data) => {
    console.log("New block:", data);
  });

  // Sau 10s unsubscribe
  setTimeout(unsubscribe, 10000);
}

// Status
console.log(provider.getStatus());

// Thêm middleware động
provider.addMiddleware(new AuthMiddleware("my-api-key"));

exampleRequest();

exampleSubscribe();
