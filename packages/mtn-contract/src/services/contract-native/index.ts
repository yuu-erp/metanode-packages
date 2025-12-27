import { SystemCore } from "@metanodejs/system-core";
import { ExecuteSmartContractRequireNative } from "../../types";

export const sendTransactionNative = async (payload: ExecuteSmartContractRequireNative) => {
  try {
    const result = await SystemCore.send({
      command: "executeSmartContract",
      value: payload,
    });
    return result.data;
  } catch (error) {
    throw error;
  }
};
