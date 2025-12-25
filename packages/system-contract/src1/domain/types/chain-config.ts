export interface NodeConfig {
  url: string;
  priority?: number; // For failover weighting
  transportType: "http" | "ws" | "tcp";
}

export interface ChainConfig {
  chainId: number;
  name: string;
  nodes: NodeConfig[];
  rpcMethods: string[]; // Supported methods for validation
  timeoutMs?: number;
  retryCount?: number;
  backoffFactor?: number;
}
