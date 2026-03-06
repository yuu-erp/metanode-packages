import { ExecuteSmartContractRequireWeb } from "../../types";

export const sendTransactionWeb = async (payload: ExecuteSmartContractRequireWeb) => {
  const response = await window.finSdk.sendTransaction(payload);
  console.log("thanhduy - sendTransactionWeb response", response);
  if (!response.success) throw response;
  return response;
};
