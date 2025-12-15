/**
 *  A Type description in a [JSON ABI format](link-solc-jsonabi).
 */
export interface JsonFragmentType {
  /**
   *  The parameter name.
   */
  readonly name?: string;

  /**
   *  If the parameter is indexed.
   */
  readonly indexed?: boolean;

  /**
   *  The type of the parameter.
   */
  readonly type?: string;

  /**
   *  The internal Solidity type.
   */
  readonly internalType?: string;

  /**
   *  The components for a tuple.
   */
  readonly components?: ReadonlyArray<JsonFragmentType>;
}

/**
 *  A fragment for a method, event or error in a [JSON ABI format](link-solc-jsonabi).
 */
export interface JsonFragment {
  /**
   *  The name of the error, event, function, etc.
   */
  readonly name?: string;

  /**
   *  The type of the fragment (e.g. ``event``, ``"function"``, etc.)
   */
  readonly type?: string;

  /**
   *  If the event is anonymous.
   */
  readonly anonymous?: boolean;

  /**
   *  If the function is payable.
   */
  readonly payable?: boolean;

  /**
   *  If the function is constant.
   */
  readonly constant?: boolean;

  /**
   *  The mutability state of the function.
   */
  readonly stateMutability?: string;

  /**
   *  The input parameters.
   */
  readonly inputs?: ReadonlyArray<JsonFragmentType>;

  /**
   *  The output parameters.
   */
  readonly outputs?: ReadonlyArray<JsonFragmentType>;

  /**
   *  The gas limit to use when sending a transaction for this function.
   */
  readonly gas?: string;
}

/**
 *  The type of a [[Fragment]].
 */
export type FragmentType = "constructor" | "error" | "event" | "fallback" | "function" | "struct";

/**
 *  An abstract class to represent An individual fragment from a parse ABI.
 */
export abstract class Fragment {
  /**
   *  The type of the fragment.
   */
  readonly type!: FragmentType;
}
