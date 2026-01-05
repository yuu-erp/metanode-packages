export interface JsonFragmentType {
  readonly name?: string;
  readonly indexed?: boolean;
  readonly type?: string;
  readonly internalType?: string;
  readonly components?: ReadonlyArray<JsonFragmentType>;
}

export interface JsonFragment {
  readonly name?: string;
  readonly type?: string; // "event" | "function" | ...
  readonly anonymous?: boolean;
  readonly payable?: boolean;
  readonly constant?: boolean;
  readonly stateMutability?: string;
  readonly inputs?: ReadonlyArray<JsonFragmentType>;
  readonly outputs?: ReadonlyArray<JsonFragmentType>;
  readonly gas?: string;
}

export interface DecodedAbiResult {
  decodedData: Record<string, unknown>;
  event: string;
}

export interface IDecodeAbiRepository {
  decodeAbi(hash: string, raw: string, topics?: Record<string, string>): Promise<DecodedAbiResult>;

  registerAbi(abiEvents: JsonFragment[]): Promise<void>;
}
