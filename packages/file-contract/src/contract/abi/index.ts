import { calculatePrice } from "./calculate-price.abi";
import { confirmServerDownloadAbi } from "./confirm-server-download.abi";
import { getFileInfo } from "./get-file-info.abi";
import { getRustServerAddresses } from "./get-rust-server-addresses.abi";
import { payForDownload } from "./pay-for-download.abi";
import { pushFileInfo } from "./push-file-info.abi";
import { uploadChunk } from "./upload-chunk.abi";
export const fileAbi = {
  calculatePrice,
  confirmServerDownloadAbi,
  getFileInfo,
  getRustServerAddresses,
  payForDownload,
  pushFileInfo,
  uploadChunk,
};
