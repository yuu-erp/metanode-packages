export const getFileInfo = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "fileKey",
        type: "bytes32",
      },
    ],
    name: "getFileInfo",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "bytes32",
            name: "merkleRoot",
            type: "bytes32",
          },
          {
            internalType: "uint64",
            name: "contentLen",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "totalChunks",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "expireTime",
            type: "uint64",
          },
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "string",
            name: "ext",
            type: "string",
          },
          {
            internalType: "string",
            name: "contentDisposition",
            type: "string",
          },
          {
            internalType: "string",
            name: "contentID",
            type: "string",
          },
          {
            internalType: "enum FileStatus",
            name: "status",
            type: "uint8",
          },
        ],
        internalType: "struct Info",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
