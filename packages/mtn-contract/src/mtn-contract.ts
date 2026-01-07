import { connectChain } from "./connect-chain";
import { sendTransactionNative } from "./services/contract-native";
import { sendTransactionWeb } from "./services/contract-web";
import { AbiItem, Address, CallFunctionPayload, ContractConfig } from "./types";
import { isCoreWeb, isValidAddress, parseData } from "./utils";

let hasInitializedChain = true;
let chainInitPromise: Promise<void> | null = null;

export class MtnContract {
  #config: ContractConfig;
  #lastHash?: ContractConfig;
  constructor(config?: ContractConfig) {
    this.#config = config || {};
    if (config && config.to) {
      this.#validateToAddress(config.to);
    }
    // void this.#connectChainOnInit().catch((error) => {
    //   console.error("Initial chain connection failed:", error);
    // });
  }

  public getConfig() {
    return this.#config;
  }

  public getLastHash() {
    return this.#lastHash;
  }

  public setToAddress(address: Address) {
    this.#validateToAddress(address);
    this.#config = { ...this.#config, to: address };
  }

  public setConfigs(configs: Partial<ContractConfig>) {
    this.#config = { ...this.#config, ...configs };
  }
  public setFromAddress(address: Address) {
    this.#validateToAddress(address);
    this.#config = { ...this.#config, from: address };
  }

  #getChainConfig() {
    return this.#config.chain ?? { ip: "139.59.243.85", port: 4200 };
  }

  async #connectChainOnInit() {
    if (isCoreWeb()) return;

    if (hasInitializedChain) return;

    if (!chainInitPromise) {
      chainInitPromise = (async () => {
        await connectChain({
          chain: this.#getChainConfig(),
        });
        hasInitializedChain = true;
      })().catch((error) => {
        chainInitPromise = null;
        throw error;
      });
    }

    await chainInitPromise;
  }

  // async #connectChainIfNeeded() {
  //   if (isCoreWeb()) return;

  //   const checkConnect = await getStatusConnected();
  //   console.log("checkConnect----", checkConnect);
  //   if (checkConnect.status) return;

  //   hasInitializedChain = false;
  //   chainInitPromise = null;

  //   await this.#connectChainOnInit();
  // }

  public async waitForChainInit(): Promise<void> {
    if (isCoreWeb()) return;

    if (hasInitializedChain) {
      console.log("Chain already initialized");
      return;
    }

    if (chainInitPromise) {
      console.log("Waiting for existing chainInitPromise...");
      await chainInitPromise;
      return;
    }

    await this.#connectChainOnInit();
  }

  // private async withChainConnection<T>(callback: () => Promise<T>, errorData = {}): Promise<T> {
  //   try {
  //     if (isCoreWeb()) {
  //       return await callback();
  //     }
  //     return await callback();
  //   } catch (error) {
  //     console.error(`Error in withChainConnection middleware:`, error);
  //     console.error("Error data: ", errorData);
  //     throw error;
  //   }
  // }

  public async sendTransaction<T = any>(payload: CallFunctionPayload): Promise<T> {
    try {
      const data = this.#formatPayload(payload);
      // console.debug(`KHAIHOAN - Send smc send data: ${payload.functionName}`, data)
      // if (payload.functionName === 'detailedSettings') {
      //   const inputNative = await nativeGenerateInput(data)
      //   console.debug(`KHAIHOAN - input smc: ${payload.functionName}`, inputNative)
      //   await share({ type: 'text', title: `${payload.functionName} - ${inputNative}` })
      // }
      let result;
      if (isCoreWeb()) {
        result = await sendTransactionWeb(data);
        console.log("KHAIHOAN - DEBUG - 2025 - result", result);
      } else {
        console.warn("window.finSdk not found, fallback to native transaction");
        result = await sendTransactionNative(data);
      }
      this.#lastHash = result?.data?.hash || "";
      const returnValue = parseData(
        result?.data?.returnValue?.[""] ??
          result?.data?.returnValue ??
          result?.data?.["return-value"] ??
          result?.data ??
          result?.returnValue,
      );
      return returnValue as T;
    } catch (error) {
      console.debug(`Send smc send data - error: ${payload.functionName}`, error);
      throw error;
    }
  }

  public generateInput(abi: AbiItem[], functionName: string, data: any) {
    const match = abi.find(({ type, name }) => type === "function" && name === functionName);
    if (!match) {
      console.error(`Function "${functionName}" not found in ABI`);
      return [];
    }

    return this.buildAbiData(match.inputs, data);
  }

  private processTupleValue(value: any, components: any[] | undefined, depth: number): any {
    if (depth === 0) {
      return components ? this.buildAbiData(components, value) : value;
    }

    if (!Array.isArray(value)) {
      return value;
    }

    return value.map((item: any) => this.processTupleValue(item, components, depth - 1));
  }

  public buildAbiData(inputs: any[], data: Record<string, any>): any[] {
    return inputs.map((input) => {
      const value = data[input.name];

      if (input.type.startsWith("tuple")) {
        const arrayDepth = (input.type.match(/\[\]/g) || []).length;

        return {
          ...input,
          value: this.processTupleValue(value, input.components, arrayDepth),
        };
      } else {
        let processedValue = value;
        if (input.internalType === "bool" && typeof value === "boolean") {
          processedValue = value.toString();
        }

        return {
          ...input,
          value: processedValue,
        };
      }
    });
  }

  #formatPayload(payload: CallFunctionPayload): CallFunctionPayload {
    const {
      from = this.#config.from ?? "",
      abiData,
      feeType = "user",
      inputArray,
      functionName,
      inputData,
      value = "0",
      gas = "3000000",
      input,
      ...rest
    } = payload;

    const isAbiArray = this.#detectAbiArray(abiData);
    // @ts-ignore
    const finalFeeType = isAbiArray ? feeType : (this.#detectFeeType(abiData) as any);
    // Chỉ xử lý inputArray/inputData khi không có input
    const handledInput = input
      ? undefined
      : inputArray ||
        (isAbiArray
          ? // @ts-ignore
            this.generateInput(abiData, functionName, inputData)
          : // @ts-ignore
            this.buildAbiData(abiData.inputs, inputData));

    const finalAbiData = isAbiArray
      ? // @ts-ignore
        abiData.filter(({ type, name }) => type === "function" && name === functionName)
      : [abiData];
    if (!finalAbiData.length) {
      console.error(`Function "${functionName}" not found in ABI`);
    }

    const bundleId = this.#getBundleId();

    return isCoreWeb()
      ? {
          ...this.#config,
          from,
          abiData: finalAbiData,
          functionName,
          isCall: true,
          type: "transaction",
          feeType: finalFeeType,
          ...(handledInput ? { inputArray: handledInput } : {}),
          input: input || "",
          amount: value,
          isReadOnly: finalFeeType === "read" || finalFeeType === "pure",
          gas: +gas,
          bundleId: bundleId ?? "",
          ...rest,
        }
      : {
          ...this.#config,
          from,
          abiData: finalAbiData,
          functionName,
          feeType: finalFeeType,
          ...(handledInput ? { inputArray: handledInput } : {}),
          input: input || "",
          isReadOnly: finalFeeType === "read" || finalFeeType === "pure",
          gas,
          value,
          bundleId: bundleId ?? "",
          ...rest,
        };
  }

  #detectAbiArray(abi: AbiItem | AbiItem[]) {
    return Array.isArray(abi);
  }

  #detectFeeType(abi: AbiItem) {
    switch (abi.stateMutability) {
      case "nonpayable":
        return "sc";
      case "view":
        return "read";
      case "pure":
        return "read";
      case "payable":
        return "user";
      default:
        throw new Error("Invalid fee type!");
    }
  }

  #validateToAddress(address?: Address) {
    if (!address) throw new Error("Missing contract address");
    if (!isValidAddress(address)) throw new Error(`Invalid contract address: ${address}`);
  }

  #getBundleId() {
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    // Ưu tiên: Nếu windowId có trong window.location.search
    if (searchParams.has("bundleId")) {
      return searchParams.get("bundleId");
    }
    // Nếu không có, kiểm tra phần hash (nếu có chứa query string)
    if (hash.includes("?")) {
      const hashQuery = hash.split("?")[1];
      const hashParams = new URLSearchParams(hashQuery);
      if (hashParams.has("bundleId")) {
        return hashParams.get("bundleId");
      }
    }
    // Nếu không tìm thấy
    return null;
  }
}
