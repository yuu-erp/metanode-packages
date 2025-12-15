import { Network } from "./network";

export interface Provider {
  /**
   *  The provider iteself.
   *
   *  This is part of the necessary API for executing a contract, as
   *  it provides a common property on any [[ContractRunner]] that
   *  can be used to access the read-only portion of the runner.
   */
  provider: this;
  /**
   *  Shutdown any resources this provider is using. No additional
   *  calls should be made to this provider after calling this.
   */
  destroy(): void;

  /**
   *  Get the current block number.
   */
  getBlockNumber(): Promise<number>;
  /**
   *  Get the connected [[Network]].
   */
  getNetwork(): Promise<Network>;
}
