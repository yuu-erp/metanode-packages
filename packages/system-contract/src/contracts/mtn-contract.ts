import { Interface } from "ethers";
import { InterfaceAbi } from "../abi";
import { SystemCoreBase } from "@metanodejs/system-core";

export class MtnContract {
  protected interface: Interface;
  protected systemCore: SystemCoreBase;

  constructor(
    protected readonly address: string,
    abi: InterfaceAbi,
    systemCore?: SystemCoreBase, // inject để test/reuse
  ) {
    this.interface = new Interface(abi);
    this.systemCore = systemCore ?? new SystemCoreBase({ isDebug: false });
  }

  async call<T = any>(fnName: string, args: any[] = [], from?: string): Promise<T> {
    const fragment = this.interface.getFunction(fnName);
    if (!fragment) throw new Error(`Function ${fnName} not found in ABI`);

    const data = this.interface.encodeFunctionData(fragment, args);

    const response = await this.systemCore.send<T>({
      command: "executeSmartContract",
      value: {
        from: from ?? "0x0000000000000000000000000000000000000000",
        to: this.address,
        input: data,
        feeType: "read",
        value: "0",
      },
    });

    const outputData =
      //@ts-ignore
      typeof response.returnValue === "string"
        ? //@ts-ignore
          response.returnValue.startsWith("0x")
          ? //@ts-ignore
            response.returnValue
          : //@ts-ignore
            "0x" + response.returnValue
        : //@ts-ignore
          response.returnValue;

    const decoded = this.interface.decodeFunctionResult(fragment, outputData);
    return decoded[0];
  }
}
