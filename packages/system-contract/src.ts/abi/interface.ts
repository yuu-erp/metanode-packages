import { FeeType } from "./fee-type";
import { JsonFragment } from "./fragments";

export interface FunctionMeta {
  functionName: string;
  abiData: JsonFragment;
  feeType: FeeType;
}

export type InterfaceAbi = string | ReadonlyArray<JsonFragment | string>;

export class Interface {
  private readonly functions = new Map<string, JsonFragment[]>();

  constructor(abi: InterfaceAbi) {
    const fragments = this.normalizeAbi(abi);

    for (const f of fragments) {
      if (f.type !== "function" || !f.name) continue;

      const list = this.functions.get(f.name) ?? [];
      list.push(f);
      this.functions.set(f.name, list);
    }
  }

  getFunctionMeta(functionName: string, inputTypes?: string[]): FunctionMeta {
    const candidates = this.functions.get(functionName);

    if (!candidates || candidates.length === 0) {
      throw new Error(`Function ${functionName} not found in ABI`);
    }

    let abiData: JsonFragment | undefined;

    if (!inputTypes) {
      if (candidates.length > 1) {
        throw new Error(`Function ${functionName} is overloaded, please specify input types`);
      }
      abiData = candidates[0];
    } else {
      abiData = candidates.find(
        (f) => f.inputs?.map((i) => i.type).join(",") === inputTypes.join(","),
      );
    }

    if (!abiData) {
      throw new Error(`No matching overload for ${functionName}`);
    }

    const feeType =
      abiData.stateMutability === "view" || abiData.stateMutability === "pure"
        ? FeeType.READ
        : FeeType.SC;

    return { functionName, abiData, feeType };
  }

  private normalizeAbi(abi: InterfaceAbi): JsonFragment[] {
    if (typeof abi === "string") {
      return JSON.parse(abi);
    }
    return abi.filter((f): f is JsonFragment => typeof f === "object");
  }
}
