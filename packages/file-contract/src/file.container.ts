import { DecodeAbi, EventLog, type EventLogData } from "@metanodejs/event-log";
import { FileContract } from "./contract";
import { buildMerkleTreePadded, getMerkleProofPadded, verifyMerkleProof } from "./utils/merkle";
import { appConfig } from "./config";
import { getPrivateKeyFromDb } from "@metanodejs/system-core";
import { generateSignature } from "./utils/signature";
import { downloadAndMergeFile } from "./utils/rust-server-client.service";
export interface FileContainerOptions {
  toAddress?: string;
  chunkSize?: number;
}

const eventAbi = [
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "bytes32", name: "fileKey", type: "bytes32" },
    ],
    name: "FileActivated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32",
        name: "downloadKey",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "fileKey",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "DownloadKeyGenerated",
    type: "event",
  },
];

type FileEventMap = {
  FileActivated: {
    user: string;
    fileKey: string;
  };
  DownloadKeyGenerated: {
    downloadKey: string;
    fileKey: string;
    user: string;
    amount: string;
  };
};

export class FileContractContainer {
  private readonly options: Required<FileContainerOptions>;
  private readonly _contract: FileContract;
  private readonly _eventLog: EventLog<FileEventMap>;

  protected static readonly DEFAULT_CHUNK_SIZE = 250 * 1024;

  private readonly peddingRequest = new Map<
    string,
    {
      resolve: (fileKey: string) => void;
      reject: (error: Error) => void;
      timeoutId: ReturnType<typeof setTimeout>;
    }
  >();

  private registeredToAddress?: string;

  constructor(options?: FileContainerOptions) {
    this.options = {
      toAddress: options?.toAddress ?? appConfig.file,
      chunkSize: options?.chunkSize ?? FileContractContainer.DEFAULT_CHUNK_SIZE,
    };

    this._contract = new FileContract();

    const decodeAbi = new DecodeAbi();
    decodeAbi.registerAbi(eventAbi);

    this._eventLog = new EventLog<FileEventMap>(decodeAbi);

    /** 🔥 LISTEN GLOBAL EVENT 1 LẦN */
    this._eventLog.onEventLog((data) => {
      if (data.type === "FileActivated") {
        this.onFileActivated(data as EventLogData<"FileActivated", FileEventMap["FileActivated"]>);
      }
      if (data.type === "DownloadKeyGenerated") {
        this.onDownloadKeyGenerated(
          data as EventLogData<"DownloadKeyGenerated", FileEventMap["DownloadKeyGenerated"]>,
        );
      }
    });
  }

  async uploadFile(file: File, from: string): Promise<string> {
    const startTime = performance.now(); // ⏱️ START

    if (!file || file.size === 0) {
      throw new Error("Invalid or empty file");
    }

    await this.ensureRegisterEvent(from);

    const buffer = new Uint8Array(await file.arrayBuffer());
    const chunks: Uint8Array[] = [];

    for (let i = 0; i < buffer.length; i += this.options.chunkSize) {
      chunks.push(buffer.slice(i, i + this.options.chunkSize));
    }

    const [leaves, merkleRoot, treeLevels] = await buildMerkleTreePadded(chunks);

    const dataPrice = await this._contract.calculatePrice(
      from,
      this.options.toAddress,
      chunks.length,
    );

    const expireTime = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
    const fileExt = file.name.includes(".") ? file.name.split(".").pop()! : "";

    const { fileKey } = await this._contract.pushFileInfo(
      from,
      this.options.toAddress,
      String(dataPrice),
      {
        owner: from,
        merkleRoot,
        contentLen: buffer.length,
        totalChunks: chunks.length,
        expireTime,
        name: file.name,
        ext: fileExt,
        contentDisposition: "inline",
        contentID: merkleRoot,
        status: 0,
      },
    );

    /** ⏳ WAIT FILE ACTIVATED */
    const EVENT_BASE_TIMEOUT = 30_000; // 30s
    const EVENT_PER_CHUNK_TIMEOUT = 20_000; // 20s / chunk
    const eventTimeoutMs = EVENT_BASE_TIMEOUT + chunks.length * EVENT_PER_CHUNK_TIMEOUT;
    const waitForActivated = new Promise<string>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.peddingRequest.delete(`${fileKey}-uploadFile`);
        reject(new Error(`Timeout waiting FileActivated for ${fileKey}`));
      }, eventTimeoutMs);

      this.peddingRequest.set(`${fileKey}-uploadFile`, { resolve, reject, timeoutId });
    });

    /** 🚀 UPLOAD CHUNKS */
    await Promise.all(
      chunks.map(async (chunk, i) => {
        const proof = await getMerkleProofPadded(treeLevels, i);
        const leafHash = leaves[i]!;

        const valid = await verifyMerkleProof(leafHash, proof, merkleRoot, i);
        if (!valid) throw new Error(`Invalid proof at chunk ${i}`);

        const chunkDataHex =
          "0x" +
          Array.from(chunk)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

        await this._contract.uploadChunk(from, this.options.toAddress, {
          fileKey,
          chunkData: chunkDataHex,
          chunkIndex: i,
          merkleProof: proof,
        });
      }),
    );
    console.log("Upload success all chunk");

    await waitForActivated;
    /** ✅ CHỜ EVENT */
    const endTime = performance.now();
    const totalTimeMs = endTime - startTime;

    const fileSizeBytes = file.size;
    const fileSizeMB = fileSizeBytes / (1024 * 1024);

    console.info(
      `[UPLOAD FILE]
      FileKey=${fileKey}
      Size=${fileSizeBytes} bytes (${fileSizeMB.toFixed(2)} MB)
      TotalTime=${(totalTimeMs / 1000).toFixed(2)}s`,
    );

    return fileKey;
  }

  async downloadFile(
    fileKey: string,
    from: string,
    downloadTimes: number = 1,
  ): Promise<{
    fileData: Uint8Array;
    fileExt: string;
    fileName: string;
  }> {
    await this.ensureRegisterEvent(from);

    const fileInfo = await this._contract.getFileInfo(from, this.options.toAddress, fileKey);
    console.log("downloadFile - fileInfo: ", fileInfo);
    const downloadPrice = await this._contract.calculatePrice(
      from,
      this.options.toAddress,
      +fileInfo.totalChunks,
    );
    const waitForDownloadKeyGenerated = new Promise<string>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.peddingRequest.delete(`${fileKey}-downloadFile`);
        reject(new Error(`Timeout waiting FileActivated for ${fileKey}`));
      }, 60_000);

      this.peddingRequest.set(`${fileKey}-downloadFile`, { resolve, reject, timeoutId });
    });
    console.log("downloadFile - downloadPrice: ", downloadPrice);
    // 3. Pay for download
    await this._contract.payForDownload(from, this.options.toAddress, String(downloadPrice), {
      fileKey,
      downloadTimes,
    });
    console.log("Pay for download success!");
    const downloadKey = await waitForDownloadKeyGenerated;
    console.log("waitForDownloadKeyGenerated - data", downloadKey);
    const privateKey = await getPrivateKeyFromDb(from);
    console.log("privateKey", privateKey);
    const signature = await generateSignature(downloadKey, privateKey);
    console.log("signature", signature);

    const fileData = await downloadAndMergeFile(
      fileKey,
      downloadKey,
      fileInfo.totalChunks,
      signature,
      from,
      this.options.toAddress,
      (downloaded, total) => {
        console.log("downloadAndMergeFile", { downloaded, total });
      },
    );

    const arrayBuffer = new ArrayBuffer(fileData.length);
    const fileDataBuffer = new Uint8Array(arrayBuffer);
    fileDataBuffer.set(fileData);

    console.log({
      fileData: fileDataBuffer,
      fileName: fileInfo.name,
      fileExt: fileInfo.ext || "",
    });
    return {
      fileData: fileDataBuffer,
      fileName: fileInfo.name,
      fileExt: fileInfo.ext || "",
    };
  }

  private onFileActivated(data: EventLogData<"FileActivated", FileEventMap["FileActivated"]>) {
    console.log("onFileActivated", data);
    const { fileKey } = data.payload;

    const pending = this.peddingRequest.get(`${fileKey}-uploadFile`);
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    pending.resolve(fileKey);
    this.peddingRequest.delete(`${fileKey}-uploadFile`);
  }

  private onDownloadKeyGenerated(
    data: EventLogData<"DownloadKeyGenerated", FileEventMap["DownloadKeyGenerated"]>,
  ) {
    console.log("onDownloadKeyGenerated", data);
    const { fileKey, downloadKey } = data.payload;

    const pending = this.peddingRequest.get(`${fileKey}-downloadFile`);
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    pending.resolve(downloadKey);
    this.peddingRequest.delete(`${fileKey}-downloadFile`);
  }

  private async ensureRegisterEvent(from: string) {
    if (this.registeredToAddress === this.options.toAddress) {
      return; // ✅ đã đăng ký rồi → bỏ qua
    }

    // ⚠️ toAddress thay đổi hoặc chưa đăng ký
    await this._eventLog.registerEvent(from, [this.options.toAddress]);

    this.registeredToAddress = this.options.toAddress;
  }
}
