import { createHash } from "@metanodejs/system-core";
import type { JsonFragment, JsonFragmentType } from "./types";

/**
 * Dữ liệu đã normalize cho 1 ABI Event
 */
interface AbiEventData {
  eventName: string;
  indexedInputs: readonly JsonFragmentType[];
  nonIndexedInputs: readonly JsonFragmentType[];
  allInputs: readonly JsonFragmentType[];
}

/**
 * Cache hash(signature) để tránh tính lại keccak
 */
const hashCache = new Map<string, string>();

export class ManageAbiEvent {
  private readonly abiEvents = new Map<string, AbiEventData>();

  /**
   * Tạo topic0 (keccak256(EventName(type1,type2,...)))
   * + đảm bảo abi.name luôn tồn tại (type-safe)
   */
  private async abiToHash(abi: JsonFragment): Promise<{ hash: string; eventName: string }> {
    if (abi.type !== "event") {
      throw new Error("ABI is not an event");
    }

    if (!abi.name) {
      throw new Error("Event ABI missing name");
    }

    const inputs = abi.inputs ?? [];

    const types = inputs.map((input, idx) => {
      if (!input.type) {
        throw new Error(`Event ${abi.name} input[${idx}] missing type`);
      }
      return input.type;
    });

    const signature = `${abi.name}(${types.join(",")})`;

    if (hashCache.has(signature)) {
      return {
        hash: hashCache.get(signature)!,
        eventName: abi.name,
      };
    }

    // MUST be keccak256
    const hash = await createHash(signature, false);
    hashCache.set(signature, hash);

    return { hash, eventName: abi.name };
  }

  /**
   * Register ABI events để decode event logs
   */
  public async registerAbi(
    abiEvents: JsonFragment[],
    options?: { override?: boolean },
  ): Promise<void> {
    for (const abi of abiEvents) {
      if (abi.type !== "event") continue;

      const { hash, eventName } = await this.abiToHash(abi);

      if (this.abiEvents.has(hash) && !options?.override) {
        continue;
      }

      const inputs = abi.inputs ?? [];

      const indexedInputs = inputs.filter((i) => i.indexed);
      const nonIndexedInputs = inputs.filter((i) => !i.indexed);

      if (indexedInputs.length > 3) {
        throw new Error(`Event ${eventName} has more than 3 indexed parameters`);
      }

      this.abiEvents.set(hash, {
        eventName,
        indexedInputs,
        nonIndexedInputs,
        allInputs: inputs,
      });
    }
  }

  /**
   * Lấy ABI Event theo topic0
   */
  public getEventByTopic0(topic0: string): AbiEventData | undefined {
    return this.abiEvents.get(topic0);
  }

  /**
   * Debug / introspection
   */
  public getRegisteredEvents(): ReadonlyMap<string, AbiEventData> {
    return this.abiEvents;
  }
}
