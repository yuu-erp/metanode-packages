import { RpcClient } from "../../domain/interfaces/rpc-client";
import { Transport } from "../../domain/interfaces/transport";
import { ChainConfig } from "../../domain/types/chain-config";
import { RpcRequest } from "../../domain/types/rpc-request";
import { RpcResponse } from "../../domain/types/rpc-response";

export class RpcClientImpl implements RpcClient {
  constructor(
    public readonly transport: Transport,
    private readonly config: ChainConfig,
  ) {}

  async send<P = unknown, R = unknown>(req: RpcRequest<P>): Promise<RpcResponse<R>> {
    if (!this.isMethodSupported(req.method)) {
      throw new Error(`RPC method ${req.method} not supported on chain ${this.config.name}`);
    }
    return this.transport.send(req);
  }

  async batchSend(reqs: RpcRequest[]): Promise<RpcResponse[]> {
    // Batch as single array request if supported, else sequential
    if (this.config.rpcMethods.includes("batch")) {
      // @ts-ignore
      return this.transport.send({ jsonrpc: "2.0", method: "batch", params: reqs, id: Date.now() });
    } else {
      return Promise.all(reqs.map((req) => this.send(req)));
    }
  }

  isMethodSupported(method: string): boolean {
    return this.config.rpcMethods.includes(method);
  }
}
