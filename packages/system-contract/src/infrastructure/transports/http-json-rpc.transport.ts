import { Transport } from "../../domain/interfaces/transport";
import { RpcRequest } from "../../domain/types/rpc-request";
import { RpcResponse } from "../../domain/types/rpc-response";
import axios from "axios"; // Assume axios installed for HTTP

export class HttpJsonRpcTransport implements Transport {
  private connected = false;
  private currentNodeUrl: string | undefined;

  async connect(nodeUrl: string): Promise<void> {
    this.currentNodeUrl = nodeUrl;
    this.connected = true; // HTTP is stateless, but mark as "connected"
  }

  async send<P = unknown, R = unknown>(
    req: RpcRequest<P>,
    nodeUrl?: string,
  ): Promise<RpcResponse<R>> {
    const url = nodeUrl || this.currentNodeUrl;
    if (!url) {
      throw new Error("No node URL provided for HTTP transport");
    }

    try {
      const response = await axios.post(url, req, {
        headers: { "Content-Type": "application/json" },
        timeout: 0, // Managed by TimeoutHandler
      });
      return response.data as RpcResponse<R>;
    } catch (error: unknown) {
      throw new Error(`HTTP RPC error: ${(error as Error).message}`);
    }
  }

  subscribe<D = unknown>(event: string, callback: (data: D) => void): () => void {
    throw new Error("Subscriptions not supported over HTTP");
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.currentNodeUrl = undefined;
  }

  isConnected(): boolean {
    return this.connected;
  }
}
