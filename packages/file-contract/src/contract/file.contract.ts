import { MtnContract } from "@metanodejs/mtn-contract";
import { fileAbi } from "./abi";
import { PayForDownloadInput, PushFileInfoInput, UploadChunkInput } from "./types";

export class FileContract extends MtnContract {
  constructor() {
    super({ to: "" });
  }

  uploadChunk(from: string, to: string, inputData: UploadChunkInput): Promise<void> {
    return this.sendTransaction({
      to,
      from,
      inputData,
      feeType: "sc",
      functionName: "uploadChunk",
      abiData: fileAbi.uploadChunk,
    });
  }

  calculatePrice(from: string, to: string, numChunks: number): Promise<number> {
    return this.sendTransaction({
      to,
      from,
      inputData: {
        numChunks,
      },
      feeType: "read",
      functionName: "calculatePrice",
      abiData: fileAbi.calculatePrice,
    });
  }

  pushFileInfo(
    from: string,
    to: string,
    value: string,
    inputData: PushFileInfoInput,
  ): Promise<{ fileKey: string }> {
    return this.sendTransaction({
      to,
      from,
      value,
      inputData: {
        info: inputData,
      },
      feeType: "sc",
      functionName: "pushFileInfo",
      abiData: fileAbi.pushFileInfo,
    });
  }

  getFileInfo(from: string, to: string, fileKey: string) {
    return this.sendTransaction({
      to,
      from,
      feeType: "read",
      inputData: {
        fileKey,
      },
      functionName: "getFileInfo",
      abiData: fileAbi.getFileInfo,
    });
  }

  getRustServerAddresses(from: string, to: string): Promise<string[]> {
    return this.sendTransaction({
      to,
      from,
      feeType: "read",
      functionName: "getRustServerAddresses",
      abiData: fileAbi.getRustServerAddresses,
    });
  }

  payForDownload(
    from: string,
    to: string,
    value: string,
    inputData: PayForDownloadInput,
  ): Promise<void> {
    return this.sendTransaction({
      to,
      from,
      value,
      inputData,
      feeType: "sc",
      functionName: "payForDownload",
      abiData: fileAbi.payForDownload,
    });
  }
}
