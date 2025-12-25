import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import https from "https";
import {
  AccountState,
  Address,
  Block,
  BlockTag,
  Log,
  LogFilter,
  Network,
  Provider,
  TransactionReceipt,
  TransactionRequest,
  TransactionResponse,
} from ".";
import { RequireAtLeastOne } from "../types/utils";
import { hexToBigInt, hexToNumber } from "../utils";

// Example implementation: JsonRpcProvider
// This is a basic example using fetch for JSON-RPC calls. In a real scenario, handle errors and full RPC mapping.
export class JsonRpcProvider implements Provider {
  private client: AxiosInstance;
  private id = 0;
  constructor(
    private readonly url: string,
    axiosConfig?: RequireAtLeastOne<AxiosRequestConfig, "baseURL">,
  ) {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
    const config = {
      headers: {
        referer: axiosConfig?.baseURL,
        origin: axiosConfig?.baseURL,
        "Content-Type": "application/json",
      },
      httpsAgent,
      timeout: 20_000,
      ...axiosConfig,
    };
    this.client = axios.create(config);
  }

  private async rpc(method: string, params: unknown[]): Promise<unknown> {
    const response = await this.client.post(this.url, {
      jsonrpc: "2.0",
      id: ++this.id,
      method,
      params,
    });
    if (response.data?.error) throw new Error(response.data.error.message ?? "JSON-RPC Error");
    return response.data.result;
  }

  public async searchTransactions(
    _queryString: string,
    _offset: number,
    _limit: number,
  ): Promise<string> {
    throw new Error("Method not implemented.");
  }

  public async getDeviceKey(lastHash: string): Promise<string> {
    return (await this.rpc("mtn_getDeviceKey", [lastHash])) as string;
  }

  public async getAccountState(address: Address, blockTag?: BlockTag): Promise<AccountState> {
    return (await this.rpc("mtn_getAccountState", [address, blockTag])) as AccountState;
  }

  public async getNetwork(): Promise<Network> {
    const chainId = (await this.rpc("eth_chainId", [])) as string;
    return { chainId: parseInt(chainId, 16), name: "unknown" }; // Extend to fetch name if needed.
  }

  public async sendTransaction(signedTx: string): Promise<TransactionResponse> {
    const hash = (await this.rpc("eth_sendRawTransaction", [signedTx])) as string;
    return { hash /* Fill other fields by querying if needed */ } as TransactionResponse;
  }

  public async getBlockNumber(): Promise<number> {
    const hex = (await this.rpc("eth_blockNumber", [])) as string;
    return hexToNumber(hex);
  }

  public async getBlock(block: number | "latest"): Promise<Block> {
    const tag = typeof block === "number" ? `0x${block.toString(16)}` : block;
    return (await this.rpc("eth_getBlockByNumber", [tag, false])) as Block;
  }

  public async getBalance(address: Address, blockTag?: BlockTag | undefined): Promise<bigint> {
    const hex = (await this.rpc("eth_getBalance", [address, blockTag])) as string;
    return hexToBigInt(hex);
  }

  public async getTransactionCount(
    address: Address,
    blockTag?: BlockTag | undefined,
  ): Promise<number> {
    const hex = (await this.rpc("eth_getTransactionCount", [address, blockTag])) as string;
    return hexToNumber(hex);
  }

  public async getTransaction(txHash: string): Promise<TransactionResponse | null> {
    return (await this.rpc("eth_getTransactionByHash", [txHash])) as TransactionResponse | null;
  }

  public async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
    return (await this.rpc("eth_getTransactionReceipt", [txHash])) as TransactionReceipt | null;
  }

  public async call(tx: TransactionRequest, blockTag?: BlockTag | undefined): Promise<string> {
    return (await this.rpc("eth_call", [tx, blockTag])) as string;
  }

  public async estimateGas(tx: TransactionRequest): Promise<bigint> {
    const hex = (await this.rpc("eth_estimateGas", [tx])) as string;
    return hexToBigInt(hex);
  }

  public async getLogs(filter: LogFilter): Promise<Log[]> {
    return (await this.rpc("eth_getLogs", [filter])) as Log[];
  }

  public on(event: string | string[], _listener: (...args: unknown[]) => void): void {
    console.log(`Subscribed to ${Array.isArray(event) ? event.join(",") : event}`);
  }

  public off(event: string | string[], _listener: (...args: unknown[]) => void): void {
    console.log(`Unsubscribed from ${Array.isArray(event) ? event.join(",") : event}`);
  }
}
