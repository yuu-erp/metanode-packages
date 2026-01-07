export const uploadChunk = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "fileKey",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "chunkData",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "chunkIndex",
        type: "uint256",
      },
      {
        internalType: "bytes32[]",
        name: "merkleProof",
        type: "bytes32[]",
      },
    ],
    name: "uploadChunk",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
