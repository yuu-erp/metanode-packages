/**
 * Chia nhỏ dữ liệu thành các phần (chunks) có kích thước tối đa được chỉ định.
 *
 * @param {string} data - Dữ liệu cần chia nhỏ.
 * @param {number} [chunkSize=64000] - Kích thước tối đa của mỗi phần (mặc định là 64,000 byte).
 * @returns {Array<{ chunk: string, index: number, totalChunks: number }>}
 *          Một mảng chứa các phần dữ liệu đã được chia nhỏ, mỗi phần có thông tin:
 *          - `chunk`: Dữ liệu của phần đó.
 *          - `index`: Chỉ mục của phần dữ liệu (bắt đầu từ 0).
 *          - `totalChunks`: Tổng số phần dữ liệu.
 * @throws {Error} Nếu dữ liệu đầu vào rỗng.
 */
export function splitDataIntoChunks(data: string, chunkSize: number = 64000) {
  if (!data) throw new Error("Data cannot be empty");

  const totalChunks = Math.ceil(data.length / chunkSize);
  return Array.from({ length: totalChunks }, (_, i) => ({
    chunk: data.slice(i * chunkSize, (i + 1) * chunkSize),
    index: i,
    totalChunks,
  }));
}

export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "object") {
    if (Array.isArray(value) || typeof value === "string") {
      return value.length === 0;
    }
    return Object.keys(value).length === 0;
  }
  return !value;
}
export const parseData = (data: any) => {
  if (!data) return data;

  const _data =
    typeof data === "string" && (data.includes("{") || data.includes("["))
      ? data
      : JSON.stringify(data);

  return JSON.parse(
    //@ts-ignore
    _data.replaceAll('"true"', "true").replaceAll('"false"', "false"),
  );
};
