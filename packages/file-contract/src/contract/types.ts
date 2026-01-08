import { FileInfo } from "../types";

export interface UploadChunkInput {
  fileKey: string;
  chunkData: string;
  chunkIndex: number;
  merkleProof: string[];
}

export interface PushFileInfoInput extends FileInfo {}

export interface GetFileInfoInput {
  fileKey: string;
}
export interface GetFileInfoOutput extends FileInfo {}

export interface PayForDownloadInput {
  fileKey: string;
  downloadTimes: number;
}
