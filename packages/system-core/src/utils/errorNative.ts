import { handleMessageError } from "./handle-message-error";

export const statusCodeMessageMap: Record<string, string> = {
  SC: "Success.",
  EF: "Invalid input data field.",
  RL: "Invalid length.",
  IH: "Value must be in hexadecimal format.",
  IF: "Invalid field.",
  PD: "You do not have permission to perform this action.",
  UE: "Unknown error.",
  CS: "Failed to call SDK.",
  EX: "An error occurred during processing.",
  ST: "Starting process...",
  PR: "Processing...",
  EN: "Completed.",
  CL: "Action has been cancelled.",
  NF: "Data not found.",
  NS: "Feature not supported.",
  CR: "Connection was refused.",
  PE: "Parsing error.",
  DE: "Database error.",
  WT: "Wrong data type.",
  NA: "Not allowed.",
  RA: "Address is required.",
  SP: "Password is not strong enough.",
  SD: "Invalid seed format.",
  FR: "Missing required nested field.",
  IB: "Insufficient balance.",
  PA: "There is a pending action.",
  CH: "Encryption/decryption error.",
  TO: "Request timed out.",
  NC: "Not configured.",
  WP: "Incorrect password.",
  CE: "Blockchain error.",
  FE: "File error.",
  DV: "Device is unresponsive.",
  NE: "Network error.",
};

export const handleGetErrorNative = (error: any): string => {
  console.log("handleGetErrorNative---", error);
  if (error && error.message) {
    return error.message;
  } else if (error && error.description) {
    return error.description;
  } else if (typeof error?.code === "string") {
    const matches = error.code.match(/([A-Z]{2})(\d+)?\]?$/);
    if (matches) {
      const baseCode = matches[1]; // Lấy phần "IB" từ "IB10"
      return statusCodeMessageMap[baseCode] || handleMessageError(error);
    }
  }
  return handleMessageError(error);
};
