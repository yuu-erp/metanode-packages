import { Addressable } from "../address";

export class BaseContract implements Addressable {
  getAddress(): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
