import net from "net"; // Node.js net module for TCP
import { Transport } from "../../domain/interfaces/transport";
import { RpcResponse } from "../../domain/types/rpc-response";
import { RpcRequest } from "../../domain/types/rpc-request";

export class TcpCustomTransport implements Transport {
  private client: net.Socket | undefined;
  private connected = false;
  private buffer = "";
  private pendingRequests: Map<string | number, (res: RpcResponse) => void> = new Map();

  // Assume custom protocol: length-prefixed JSON (4 bytes BE length + JSON)

  async connect(nodeUrl: string): Promise<void> {
    const [host, portStr] = nodeUrl.replace("tcp://", "").split(":");
    const port = parseInt(portStr, 10);

    return new Promise((resolve, reject) => {
      this.client = net.createConnection(port, host, () => {
        this.connected = true;
        resolve();
      });

      this.client.on("error", reject);
      this.client.on("close", () => (this.connected = false));

      this.client.on("data", (data) => {
        this.buffer += data.toString("utf8");
        while (this.buffer.length >= 4) {
          const len = parseInt(this.buffer.slice(0, 4), 16); // Hex length for simplicity
          if (this.buffer.length < 4 + len) break;
          const jsonStr = this.buffer.slice(4, 4 + len);
          const res = JSON.parse(jsonStr) as RpcResponse;
          const resolver = this.pendingRequests.get(res.id);
          if (resolver) {
            resolver(res);
            this.pendingRequests.delete(res.id);
          }
          this.buffer = this.buffer.slice(4 + len);
        }
      });
    });
  }

  async send<P = unknown, R = unknown>(req: RpcRequest<P>): Promise<RpcResponse<R>> {
    if (!this.client || !this.connected) {
      throw new Error("TCP not connected");
    }

    const json = JSON.stringify(req);
    const lenHex = json.length.toString(16).padStart(4, "0");
    const payload = Buffer.from(lenHex + json, "utf8");

    return new Promise((resolve) => {
      this.pendingRequests.set(req.id, resolve as (res: RpcResponse) => void);
      this.client!.write(payload);
    });
  }

  subscribe<D = unknown>(event: string, callback: (data: D) => void): () => void {
    // Implement custom sub protocol if needed; placeholder
    throw new Error("Subscriptions over TCP custom not implemented");
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.destroy();
      this.connected = false;
      this.pendingRequests.clear();
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
