export type Chain = {
  ip: string;
  port: number;
};

export enum PlatformEnum {
  ANDROID,
  IOS,
  WEB,
}

export type IAppConfig = {
  publicKey: string;
  usdtAddress: string;
  notiAddress: string;
};

export type Address = string;

export type FeeType = "user" | "read" | "sc";

export interface ContractConfig {
  to?: Address;
  from?: Address;
  gas?: number | string;
  chain?: Chain;
}

export interface AbiInputOutput {
  name?: string;
  type?: string;
  internalType?: string;
  components?: unknown[];
}

export interface AbiItem {
  name: string;
  type: string;
  inputs: AbiInputOutput[];
  outputs: AbiInputOutput[];
  stateMutability: string;
}

export interface CallFunctionPayload {
  to?: Address;
  from?: Address;
  abiData: AbiItem | AbiItem[];
  functionName: string;
  inputArray?: any[];
  inputData?: any;
  value?: string;
  amount?: string;
  gas?: string | number;
  feeType?: FeeType;
  isCall?: boolean;
  isReadOnly?: boolean;
  type?: string;
  abiEvent?: any[];
  bundleId?: string;
  input?: string;
}

export interface ExecuteSmartContractRequireNative extends CallFunctionPayload {
  type?: string;
}

export interface ExecuteSmartContractRequireWeb extends CallFunctionPayload {}
