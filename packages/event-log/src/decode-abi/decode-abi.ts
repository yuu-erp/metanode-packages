import { decodeAbi } from "@metanodejs/system-core";
import { ManageAbiEvent } from "./manage-abi-event";
import type { DecodedAbiResult, IDecodeAbiRepository, JsonFragmentType } from "./types";

/**
 * Decode ABI Event Logs
 */
export class DecodeAbi extends ManageAbiEvent implements IDecodeAbiRepository {
  constructor() {
    super();
  }

  /**
   * Decode indexed params từ topics
   * @param topics Topics từ event log (topics['0'], topics['1'], ...)
   * @param indexedInputs Indexed inputs từ ABI
   */
  #decodeIndexedParams(
    topics: Record<string, string>,
    indexedInputs: readonly JsonFragmentType[],
  ): Record<string, string> {
    const indexedData: Record<string, string> = {};

    // topics['0'] là event signature hash
    indexedInputs.forEach((input, index) => {
      if (!input.name || !input.type) return;

      const topicKey = String(index + 1);
      const topicValue = topics[topicKey];
      if (!topicValue) return;

      // address: lấy 20 bytes cuối
      if (input.type === "address") {
        const cleanHex = topicValue.replace(/^0x/i, "");
        const address = cleanHex.slice(-40).toLowerCase();
        indexedData[input.name] = `0x${address}`;
        return;
      }

      // bytes32, uint256, etc → raw topic
      indexedData[input.name] = topicValue;
    });

    return indexedData;
  }

  /**
   * Decode event log
   */
  async decodeAbi(
    hash: string,
    raw: string,
    topics?: Record<string, string>,
  ): Promise<DecodedAbiResult> {
    if (!hash || typeof hash !== "string") {
      throw new Error("Invalid input: hash must be a non-empty string");
    }

    const abiData = this.getEventByTopic0(hash);
    if (!abiData) {
      throw new Error(`ABI event for hash ${hash} not found`);
    }

    /**
     * 1. Decode indexed params
     */
    const indexedData = topics ? this.#decodeIndexedParams(topics, abiData.indexedInputs) : {};

    /**
     * 2. Không có non-indexed params
     */
    if (abiData.nonIndexedInputs.length === 0 && (!raw || raw.trim() === "")) {
      return {
        decodedData: indexedData,
        event: abiData.eventName,
      };
    }

    /**
     * 3. Decode non-indexed params từ data
     */
    let nonIndexedData: Record<string, unknown> = {};

    if (abiData.nonIndexedInputs.length > 0 && raw && raw.trim() !== "") {
      try {
        const decoded = await decodeAbi({
          functionName: abiData.eventName,
          outputs: [...abiData.nonIndexedInputs], // ✅ clone mutable
          rawInput: raw,
        });

        nonIndexedData = decoded as Record<string, unknown>;
      } catch (error) {
        console.warn("[DECODE ABI] Failed to decode non-indexed params", {
          hash,
          raw,
          event: abiData.eventName,
          error,
        });
      }
    }

    /**
     * 4. Combine indexed + non-indexed
     */
    return {
      decodedData: {
        ...indexedData,
        ...nonIndexedData,
      },
      event: abiData.eventName,
    };
  }
}
