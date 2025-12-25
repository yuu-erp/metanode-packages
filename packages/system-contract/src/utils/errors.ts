export type ErrorCode =
  // Generic Errors
  | "UNKNOWN_ERROR"
  | "NOT_IMPLEMENTED"
  | "UNSUPPORTED_OPERATION"
  | "NETWORK_ERROR"
  | "SERVER_ERROR"
  | "TIMEOUT"
  | "BAD_DATA"
  | "CANCELLED"

  // Operational Errors
  | "BUFFER_OVERRUN"
  | "NUMERIC_FAULT"

  // Argument Errors
  | "INVALID_ARGUMENT"
  | "MISSING_ARGUMENT"
  | "UNEXPECTED_ARGUMENT"
  | "VALUE_MISMATCH"

  // Blockchain Errors
  | "CALL_EXCEPTION"
  | "INSUFFICIENT_FUNDS"
  | "NONCE_EXPIRED"
  | "REPLACEMENT_UNDERPRICED"
  | "TRANSACTION_REPLACED"
  | "UNCONFIGURED_NAME"
  | "OFFCHAIN_FAULT"

  // User Interaction
  | "ACTION_REJECTED";
/**
 *  Throws an EthersError with %%message%%, %%code%% and additional error
 *  %%info%% when %%check%% is falsish..
 *
 *  @see [[api:makeError]]
 */
export function assert<K extends ErrorCode, T extends CodedEthersError<K>>(
  check: unknown,
  message: string,
  code: K,
  info?: ErrorInfo<T>,
): asserts check {
  if (!check) {
    throw makeError(message, code, info);
  }
}
