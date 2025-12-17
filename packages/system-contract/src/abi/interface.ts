import { Fragment, JsonFragment } from "./fragments";

// Fragment Chưa hoàn thiện => danh cho các Library / framework / core infra
export type InterfaceAbi = string | ReadonlyArray<Fragment | JsonFragment | string>;

export const balanceOfAbi: InterfaceAbi = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
    ],
    name: "getRoleAdmin",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
