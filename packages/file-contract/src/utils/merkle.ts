import { createHashWithBuffer } from "@metanodejs/system-core";

const EMPTY_HASH = "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

let cachedEmptyHash: string | null = null;

const getEmptyHash = async (): Promise<string> => {
  if (cachedEmptyHash) return cachedEmptyHash;
  cachedEmptyHash = EMPTY_HASH;
  return cachedEmptyHash;
};

const sha256 = async (data: Uint8Array): Promise<string> => {
  if (data.length === 0) {
    return await getEmptyHash();
  }

  const bufferAsNumberArray = Array.from(data);
  try {
    const { hash } = await createHashWithBuffer({
      buffer: bufferAsNumberArray,
    });
    return hash;
  } catch (error) {
    console.error("sha256 error---", error);
    console.log("bufferAsNumberArray---", bufferAsNumberArray);
    return "";
  }
};

const hexToBytes = (hex: string): Uint8Array => {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (cleanHex.length === 0) return new Uint8Array(0);

  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
};

const nextPowerOfTwo = (n: number): number => {
  if (n <= 0) return 1;
  n--;
  n |= n >> 1;
  n |= n >> 2;
  n |= n >> 4;
  n |= n >> 8;
  n |= n >> 16;
  return n + 1;
};

export const buildMerkleTreePadded = async (
  chunks: Uint8Array[],
): Promise<[string[], string, string[][]]> => {
  const numLeaves = chunks.length;

  if (numLeaves === 0) {
    const empty = await getEmptyHash();
    return [[], empty, []];
  }

  const total = nextPowerOfTwo(numLeaves);
  const leaves: string[] = new Array(total);
  const emptyHash = await getEmptyHash();

  const realHashes = await Promise.all(chunks.map(sha256));

  for (let i = 0; i < total; i++) {
    leaves[i] = i < numLeaves ? realHashes[i]! : emptyHash;
  }

  // Build tree và cache tất cả levels
  const levels: string[][] = [leaves];
  let level = leaves;
  while (level.length > 1) {
    const nextLevel: string[] = [];

    for (let i = 0; i < level.length; i += 2) {
      const leftHex = level[i]!;
      const rightHex = level[i + 1] ?? emptyHash;

      const leftBytes = hexToBytes(leftHex);
      const rightBytes = hexToBytes(rightHex);

      const combined = new Uint8Array(64);
      combined.set(leftBytes, 0);
      combined.set(rightBytes, 32);

      const parent = await sha256(combined);
      nextLevel.push(parent);
    }

    levels.push(nextLevel);
    level = nextLevel;
  }

  return [leaves, level[0]!, levels];
};

/**
 * Get Merkle proof sử dụng cached tree levels (không rebuild tree)
 * @param levels Các levels của Merkle tree đã được build (từ buildMerkleTreePadded)
 * @param index Index của leaf cần lấy proof
 */
export const getMerkleProofPadded = async (
  levels: string[][],
  index: number,
): Promise<string[]> => {
  const proof: string[] = [];
  let idx = index;

  const emptyHash = await getEmptyHash();

  // Chỉ cần traverse levels đã build để lấy proof (không rebuild)
  for (let levelIdx = 0; levelIdx < levels.length - 1; levelIdx++) {
    const level = levels[levelIdx]!;
    const isLeft = idx % 2 === 0;
    const siblingIdx = isLeft ? idx + 1 : idx - 1;

    const siblingHash = siblingIdx < level.length ? level[siblingIdx]! : emptyHash;
    proof.push(siblingHash);

    idx = Math.floor(idx / 2);
  }

  return proof;
};

export const verifyMerkleProof = async (
  leafHash: string,
  proof: string[],
  root: string,
  index: number,
): Promise<boolean> => {
  let hash = leafHash;

  for (let i = 0; i < proof.length; i++) {
    const sibling = proof[i]!;
    const isLeft = (index >> i) % 2 === 0;

    const leftBytes = isLeft ? hexToBytes(hash) : hexToBytes(sibling);
    const rightBytes = isLeft ? hexToBytes(sibling) : hexToBytes(hash);

    const combined = new Uint8Array(64);
    combined.set(leftBytes, 0);
    combined.set(rightBytes, 32);

    hash = await sha256(combined);
  }

  return hash === root;
};
