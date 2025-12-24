import { JsonFragment } from "./abi";
import { Interface } from "./abi/interface";

console.log("XIN CHÀO CONTRACT");

const abi: JsonFragment[] = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "foo",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "foo",
    stateMutability: "view",
    inputs: [{ type: "address" }],
  },
];

const iface = new Interface(abi);

const functionBalanceOf = iface.getFunctionMeta("balanceOf");

console.log(functionBalanceOf);
console.log("==============");
console.log(iface.getFunctionMeta("transfer").abiData);
