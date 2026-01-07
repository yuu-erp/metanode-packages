export interface FileInfo {
  owner: string;
  merkleRoot: string;
  contentLen: number;
  totalChunks: number;
  expireTime: number;
  name: string;
  ext: string;
  contentDisposition: "inline";
  contentID: string;
  status: 0;
}
