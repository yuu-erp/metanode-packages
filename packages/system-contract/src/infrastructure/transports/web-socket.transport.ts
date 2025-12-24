import WebSocket from "ws"; // Assume ws library for Node.js
import { Transport } from "../../domain/interfaces/transport";
import { RpcResponse } from "../../domain/types/rpc-response";
import { RpcRequest } from "../../domain/types/rpc-request";

export class WebSocketTransport implements Transport {
  private ws: WebSocket | undefined;
  private connected = false;
  private pendingRequests: Map<string | number, (res: RpcResponse) => void> = new Map();
  private subscriptions: Map<string, (data: unknown) => void> = new Map();

  async connect(nodeUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(nodeUrl);

      this.ws.on("open", () => {
        this.connected = true;
        resolve();
      });

      this.ws.on("error", reject);

      this.ws.on("close", () => {
        this.connected = false;
      });

      this.ws.on("message", (data: string) => {
        const res = JSON.parse(data) as RpcResponse | { method: string; params: unknown[] };
        if ("id" in res) {
          const resolver = this.pendingRequests.get(res.id);
          if (resolver) {
            resolver(res);
            this.pendingRequests.delete(res.id);
          }
        } else if ("method" in res && this.subscriptions.has(res.method)) {
          this.subscriptions.get(res.method)!(res.params[0]);
        }
      });
    });
  }

  async send<P = unknown, R = unknown>(req: RpcRequest<P>): Promise<RpcResponse<R>> {
    if (!this.ws || !this.connected) {
      throw new Error("WebSocket not connected");
    }

    return new Promise((resolve) => {
      this.pendingRequests.set(req.id, resolve as (res: RpcResponse) => void);
      this.ws.send(JSON.stringify(req));
    });
  }

  subscribe<D = unknown>(event: string, callback: (data: D) => void): () => void {
    const subReq = {
      jsonrpc: "2.0",
      method: "eth_subscribe",
      params: [event],
      id: Date.now(),
    };
    this.send(subReq).then((res) => {
      if (res.result) {
        this.subscriptions.set(res.result as string, callback);
      }
    });

    return () => this.subscriptions.delete(event);
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.connected = false;
      this.pendingRequests.clear();
      this.subscriptions.clear();
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
