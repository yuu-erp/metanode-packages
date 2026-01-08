import { SystemCore } from "./SystemCore";
import { isEmpty, parseData } from "./utils";
import type {
  CallFunctionPayload,
  Chain,
  Dapp,
  IFile,
  IInsertProfile,
  ILoadMainWithRef,
  Permission,
  Profile,
  Seed,
  SendMtdResponse,
  Token,
  UnzipedFile,
  Wallet,
  WalletHistoryResponse,
} from "./types/core.type";
import { handleGetErrorNative } from "./utils/errorNative";

export const sendCommand = async (command: string, value?: any): Promise<any> => {
  try {
    const res = await SystemCore.send({ command, value });
    return res?.data?.data ?? res?.data ?? res;
  } catch (error: any) {
    if (!isEmpty(error?.data)) throw error.data;
    throw error;
  }
};

const createTimeout = (
  reject: Function,
  eventName: string,
  message: string,
  timeoutDuration = 60000,
) => {
  return setTimeout(() => {
    reject(message);
    SystemCore.removeAllEventListeners(eventName);
  }, timeoutDuration);
};

const clearListeners = (timeout: NodeJS.Timeout, eventName: string) => {
  clearTimeout(timeout);
  SystemCore.removeAllEventListeners(eventName);
};

export const connectNode = async (value: {
  wallets: Wallet[] | { address: string }[];
  node: Chain;
  storageAddress?: string;
  storageHost?: string;
}): Promise<boolean> => {
  const eventName = "connectNode";

  return new Promise(async (resolve, reject) => {
    // const timeout = createTimeout(reject, eventName, 'Timeout connect node!', 10000)
    try {
      console.log("CONNECT NODE VALUE", value);
      const result = await sendCommand(eventName, value);
      console.log("CONNECT NODE SUCCESS:", result);
      // clearListeners(timeout, eventName)
      result ? resolve(true) : reject("Connect node failed");
    } catch (error) {
      console.log("connect node error ---", error);
      // clearListeners(timeout, eventName)
      reject(handleGetErrorNative(error));
    }
  });
};

export const sendTransaction = async <T = SendMtdResponse>(value: {
  from: string;
  to: string;
  value: string;
}): Promise<T> => {
  const eventName = "sendTransaction";
  return new Promise(async (resolve, reject) => {
    const timeout = createTimeout(reject, eventName, "Timeout send transaction!");
    sendCommand(eventName, value)
      .then((res) => {
        resolve(res);
      })
      .catch((error) => {
        reject(error);
      })
      .finally(() => clearListeners(timeout, eventName));
  });
};

export const handleSendFile = async (value: {
  path: string;
  password: string;
}): Promise<boolean> => {
  const eventName = "send-file-result";

  return new Promise(async (resolve, reject) => {
    const timeout = createTimeout(reject, eventName, "Timeout SEND FILE!", 5000);

    const listenSendFile = (res: any) => {
      console.log("SEND FILE SUCCESS:", res);
      clearListeners(timeout, eventName);
      res?.success ? resolve(true) : reject("SEND FILE failed");
    };

    try {
      console.log("SEND FILE VALUE", value);
      SystemCore.on(eventName, listenSendFile);
      await sendFile(value);
    } catch (error) {
      clearListeners(timeout, eventName);
      reject(handleGetErrorNative(error));
    }
  });
};

export const requestPermission = async (
  permission: Permission,
  logo = "https://img.fi.ai/metanode-logo.jpg",
) => {
  try {
    const policyUrls: Partial<Record<Permission, string>> = {
      camera: "https://metanode.co/privacy#sharing",
      micro: "https://metanode.co/privacy#sharing",
    };
    console.log({ policyUrls });
    const res = await sendCommand("request-permission", {
      permission: permission,
      description: `We will need your ${permission} to give you better experience.`,
      logo,
      policy: policyUrls?.[permission] || "https://metanode.co/privacy",
      title: `Allow your ${permission}`,
    });
    return res?.granted;
  } catch (error) {
    console.error(error);
  }
};

export const checkPermission = async (permission: Permission): Promise<number> =>
  (await sendCommand("check-permission", { permission }))?.status;

export const ensurePermissionGranted = async (permission: Permission) => {
  const status = await checkPermission(permission);
  if (status !== 1) {
    const granted = await requestPermission(permission);
    if (!granted) throw new Error(`${permission} permission denied`);
  }
};

let isScanning = false;

export const scanQr = async <T = any>(): Promise<T> => {
  if (isScanning) {
    return "Scanning" as any;
  }

  isScanning = true; // bắt đầu quét

  try {
    console.log("s1");
    const status = await checkPermission("camera");
    console.log("s2", status);

    if (status !== 1) {
      console.log("s2.1", status);
      const granted = await requestPermission("camera");
      console.log("s2.2", granted);
      if (!granted) throw new Error("Camera permission denied");
    }

    console.log("s3", status);
    const result = await sendCommand("scan-qr");
    console.log("result---", result);
    const cleaned = typeof result === "string" ? result.replace("||scan-qr", "") : result;

    if (typeof cleaned === "string") {
      try {
        const parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      } catch {}
      return cleaned as any;
    }

    return cleaned;
  } finally {
    isScanning = false;
  }
};

export const handleLockKey = async (
  command: "insertLock" | "updateLockKey",
  value: {
    lockKey: string;
    address: string;
    type: number;
  },
) => {
  return await sendCommand(command, value);
};

export const getAllWallets = async <T = Wallet>(): Promise<T[]> =>
  await sendCommand("getAllWallets");

export const getMySetting = async <T = unknown>(id?: number): Promise<T> =>
  await sendCommand("getMySetting", id && { id });

export const getActiveWallet = async <T = Wallet>(): Promise<T> =>
  await sendCommand("getSettingDApp");

export const removeAllWallets = async (): Promise<any> => await sendCommand("removeAllWallets");

export const closeMiniWallet = async (wallet: Wallet) =>
  await sendCommand("close-mini-wallet", {
    success: true,
    data: {
      wallet,
    },
  });

export const closeSelectPaymentWallet = async (wallet: Wallet) =>
  await sendCommand("close-select-payment-wallet", {
    success: true,
    data: {
      wallet,
    },
  });

export const writeToLocalStorage = async (key: string, data: any, id = "") =>
  await sendCommand("write-to-local-storage", { key, data, id });

export const readFromLocalStorage = async <T = unknown>(key: string): Promise<T> => {
  const res = await sendCommand(`read-from-local-storage-${key}`, { key });
  return parseData(res);
};

export const getSeed = async <T = Seed>(language = "english"): Promise<T> =>
  await sendCommand("getSeed", { language });

export const previewAddressFromPrivateKey = async (
  privateKey: string,
): Promise<{
  publicKey: string;
  address: string;
}> => await sendCommand("previewAddressFromPrivateKey", { privateKey });

export const createWalletFromPrivateKey = async (value: {
  privateKey: string;
  name: string;
  backgroundImage: string;
}): Promise<Wallet> => await sendCommand("createWalletFromPrivateKey", value);

export const getAddressFromSeed = async <T = string>(seed: string[]): Promise<T> =>
  (await sendCommand("getAddressFromSeed", { seed }))?.address;

export const createWallet = async <T = Wallet>(value: {
  seed: string[];
  name: string;
  backgroundImage: string;
}): Promise<T> => await sendCommand("createWallet", value);

export const connectWallet = async (theme?: "light" | "dark") =>
  await sendCommand("connect-wallet", {
    theme: theme ?? "dark",
  });

export const setWalletActiveDApp = async (wallet?: Wallet) =>
  await sendCommand("setWalletActiveDApp", { wallet: wallet ?? {} });

export const startRecordVoice = async () => await sendCommand("startRecordVoice");

export const getAiResponse = async (string: string) =>
  await sendCommand("getAiResponse", { prompt: string });

export const startChatAI = async () => await sendCommand("startChatAi");

export const endChatAi = async () => await sendCommand("endChatAi");

export const startVoiceChatAI = async (language: string) =>
  await sendCommand("startVoiceChatAi", { language: language });

export const stopVoiceChatAI = async () => await sendCommand("stopVoiceChatAi");
export const getPrivateKeyFromDb = async <T = string>(address: string): Promise<T> =>
  (await sendCommand("getPrivateKeyFromDb", { address }))?.privateKey;

export const getSeedFromDb = async <T = string>(address: string): Promise<T[]> =>
  (await sendCommand("getSeedFromDb", { address }))?.seed;

export const copyClipboard = async (data: string) =>
  await sendCommand("copy-clipboard", { value: data });

export const getFromClipboard = async () => {
  const result = await sendCommand("get-from-clipboard");
  console.log("getFromClipboard - result: ", result);

  if (!result || result === "null") return "";

  if (typeof result === "string") {
    return { value: result };
  }

  return result;
};

export const backupWallet = async <T = string>(value: {
  address: string;
  password: string;
}): Promise<T> => (await sendCommand("backup-wallet", value))?.path;

export const share = async (value: { type: "file" | "text"; title?: string; path?: string }) =>
  await sendCommand("share", value);

export const getFileZip = async <T = IFile>(): Promise<T> => await sendCommand("get-file-zip");

export const restoreWallet = async <
  T = { address: string; hash: string; name: string; privateKey: string; publicKey: string },
>(value: {
  path: string;
  password: string;
}): Promise<T> => await sendCommand("restoreWallet", value);

export const zipFile = async <T = string>(value: {
  name: string;
  password: string;
  data: string;
  ext?: string;
}): Promise<T> => {
  const result = await sendCommand("zip-file", value);
  if (result?.path) return result.path;
  return result;
};

export const zipFilesToFolder = async <T = string>(value: {
  fileName: string;
  password: string;
  filePaths: string[];
}): Promise<T> => {
  const result = await sendCommand("zipFilesToFolder", value);
  if (result?.zipFilePath) return result.zipFilePath;
  return result;
};

export const unzip = async <T = UnzipedFile>(value: {
  path: string;
  password: string;
}): Promise<T[]> => (await sendCommand("unzip", value)).content;

export const unzipFile = async <T = UnzipedFile>(value: {
  path: string;
  password: string;
  name: string;
  typeCheck: string;
}): Promise<T[]> => await sendCommand("unzip-file", value);

export const readFileContentEnc = async (path: string, publicKey: string, address: string) =>
  (await sendCommand("read-file-content", { path, publicKey, address }))?.content;

export const readFileContent = async (path: string) =>
  (await sendCommand("read-file-content", { path }))?.content;

export const deleteWalletByAddress = async (address: string) =>
  await sendCommand("deleteWalletByAddress", { address });

export const deleteTransactionByFromAddress = async (address: string) =>
  await sendCommand("deleteTransactionByFromAddress", { address });

export const getTransaction = async <T = WalletHistoryResponse>(value: {
  address: string;
  page: number;
  limit?: number;
  tokenAddress?: string;
}): Promise<T> => {
  const transs = await sendCommand("getTransaction", {
    ...value,
    limit: value?.limit || 10,
  });
  console.log("transs", transs);
  return transs;
};

export const getTransactionPC = async <T = WalletHistoryResponse>(value: {
  address: string;
  page: number;
  limit?: number;
  tokenAddress?: string;
}): Promise<T> => {
  try {
    const res = await SystemCore.send({
      command: "getTransaction",
      value: {
        ...value,
        limit: value?.limit || 10,
      },
    });

    console.log("res--- getTransactionPC", res);

    return res?.data;
  } catch (error: any) {
    console.log("sendCommand Error----", error);
    if (!isEmpty(error?.data)) throw error.data;
    throw error;
  }
};

export const updateWalletUI = async (value: Wallet) => await sendCommand("updateWalletUI", value);

export const captureScreen = async (base64: string) =>
  await sendCommand("capture-screen", { base64 });

export const connectToServerSocket = async (ip: string) =>
  await sendCommand("connect-to-server-socket", { ip });

export const openServerSocket = async <T = string>(): Promise<T> =>
  (await sendCommand("open-server-socket"))?.ip;

export const closeServerSocket = async () => await sendCommand("close-server-socket");

export const sendFile = async (value: { path: string; password: string }) =>
  await sendCommand("send-file", value);

export const getAllTokens = async <T = Token>(parentAddress: string): Promise<T[]> =>
  await sendCommand("getAllTokens", { parentAddress });

export const deleteListWalletByAddress = async (wallets: string[]) =>
  await sendCommand("deleteListWalletByAddress", { wallets });

export const openCreateWallet = async () => await sendCommand("openCreateWallet");

export const getHiddenWallet = async <T = { address: string }>(): Promise<T> => {
  console.log("start get hidden wallet");
  return await sendCommand("getHiddenWallet");
};

export const exitApp = async () => await sendCommand("exit-app");

export const getTimezone = async () => await sendCommand("get-timezone");

export const insertProfile = async <T = IInsertProfile>(value: T) =>
  await sendCommand("insertProfile", value);

export const loadMainWithReferralCode = async (value: ILoadMainWithRef) =>
  await sendCommand("load-main-with-referral-code", value);

export const chooseGalery = async <T = { path: string }>(): Promise<T> =>
  await sendCommand("select-image");

export const getBase64FromPath = async <T = { base64: string }>(path: string): Promise<T> =>
  await sendCommand("getBase64FromPath", { path });

export const takePicture = async <T = { path: string }>(): Promise<T> => {
  return await sendCommand("take-picture");
};

export const scanIPServerActive = async (value: { port: number; startIp: number; endIp: number }) =>
  await sendCommand("scanIPServerActive", value);

export const stopScanIPServer = async () => await sendCommand("stopScanIPServer");
export const getTimeZoneNative = async () => await sendCommand("get-timezone");

export const getPublicKeyFromDb = async <T = { publicKey: string }>(value: {
  address: string;
}): Promise<T> => await sendCommand("getPublicKeyFromDb", value);

export const createSign = async <T = { sign: string }>(value: {
  address: string;
  message: string;
  isHex: boolean;
}): Promise<T> => await sendCommand("createSign", value);

export const getDeviceId = async () => await sendCommand("getDeviceId");
export const setMinerSettingNative = async (value: any) =>
  await sendCommand("setMinerSetting", value);

export const startMine = async (value: any) => await sendCommand("startMine", value);

export const stopMine = async () => await sendCommand("stopMine");

export const checkNFCStatus = async () => await sendCommand("checkNFCStatus");

export const scanEMV = async () => await sendCommand("scan-emv");

export const getTokenBalance = async (value: { address: string; tokenAddress: string }) =>
  await sendCommand("tokenBalance", value);

export const deploySmartContract = async (value: {
  from: string;
  abiData: any[];
  binData: string;
  functionName: string;
  inputArray: any[];
  value: string;
  storageCustom: {
    host: string;
    address: string;
  };
  gas: string;
}) => await sendCommand("deploySmartContract", value);

export const deleteToken = async (value: { address: string; parentAddress: string }) =>
  await sendCommand("deleteToken", value);

export const getLockByAddress = async (address: string) =>
  await sendCommand("getLockByAddress", { address });

export const createHash = async <T = string>(message: string, isHex: boolean): Promise<T> =>
  (await sendCommand("createHash", { message, isHex })).hash;

export const startListenGGWave = async <T = void>(): Promise<T> => {
  const status = await checkPermission("micro");
  if (status !== 1) {
    const granted = await requestPermission("micro");
    if (!granted) throw new Error("Micro permission denied");
  }
  return sendCommand("startListenGGWave");
};

export const stopListenGGWave = async () => await sendCommand("stopListenGGWave");

export const autoSendMessageGGWave = async (value: {
  message: string;
  cmd: string;
  extraData: string;
}) => await sendCommand("autoSendMessageGGWave", value);

export const stopSendMessageGGWave = async () => await sendCommand("stopSendMessageGGWave");

export const getStatusConnected = async () => await sendCommand("getStatusConnected");
export const getContacts = async () => {
  const status = await checkPermission("read_contacts");
  if (status !== 1) {
    const granted = await requestPermission("read_contacts");
    if (!granted) throw new Error("Contact permission denied");
  }
  return sendCommand("get-contacts");
};

export const sendSmsByDefaultApp = async (value: { phoneNumber: string; message: string }) =>
  await sendCommand("sendSmsByDefaultApp", value);

export const tel = async (phoneNumber: string) => await sendCommand("tel", { phoneNumber });

export const getWalletDetail = async (address: string) =>
  await sendCommand("getWalletDetail", { address });

export const getNetworkSpeed = async () => await sendCommand("getNetworkSpeed");

export const getWalletByAddress = async <T = any>(address: string): Promise<T> =>
  await sendCommand("getWalletByAddress", { address });

export const insertWallet = async (wallet: any) => await sendCommand("insertWallet", wallet);

export const insertTransaction = async (tsn: any) => await sendCommand("insertTransaction", tsn);

export const checkWhitelistIsExists = async <T = boolean>(address: string): Promise<T> =>
  (await sendCommand("checkWhitelistIsExists", { address })).isExists;

export const getWhitelistPagination = async (page: number, limit = 10) =>
  await sendCommand("getWhitelistPagination", {
    page,
    limit,
  });

export const getLastTranfer = async (page: number, limit = 10) =>
  await sendCommand("get-last-transfer", {
    page,
    limit,
  });

export const insertWhitelist = async (address: string, name: string) =>
  await sendCommand("insertWhitelist", { address, name });

export const verifySign = async (value: { message: string; publicKey: string; sign: string }) =>
  await sendCommand("verifySign", value);

export const insertToken = async (value: {
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  address: string;
  parentAddress: string;
}) => await sendCommand("insertToken", value);

export const getEncryptedPublicKey = async <T = { encryptedPublicKey: string }>(
  address?: string,
  privateKey?: string,
): Promise<T> => {
  if (!address && !privateKey) throw new Error("Invalid data");

  return await sendCommand("getEncryptedPublicKey", {
    ...(address && { address }),
    ...(privateKey && { privateKey }),
  });
};

export const loadTopupMetanium = async (url: string) =>
  await sendCommand("load-topup-metanium", {
    url,
  });

export const updateWalletColdBalance = async (balance: string, address: string) =>
  await sendCommand("updateWalletColdBalance", { balance, address });

export const nativeGenerateInput = async <T = string>(
  value: Pick<CallFunctionPayload, "to" | "abiData" | "inputArray" | "functionName" | "feeType">,
): Promise<T> =>
  (
    await sendCommand("generateInput", {
      ...value,
      "function-name": value.functionName,
    })
  ).input;

export const updateTokenTotalSupply = async <T = Token>(
  address: string,
  parentAddress: string,
  totalSupply: string,
): Promise<T[]> =>
  await sendCommand("updateTokenTotalSupply", {
    address,
    parentAddress,
    totalSupply,
  });
export const getSharedWallets = async <T = Wallet>(): Promise<T[]> =>
  await sendCommand("getSharedWallets");

export const getWalletToShare = async <T = Wallet>(): Promise<T[]> =>
  await sendCommand("getWalletToShare");

export const getAllProfiles = async <T = Profile>(): Promise<T[]> =>
  await sendCommand("getAllProfiles");

export const onOfflineMode = async <T = any>(): Promise<T[]> =>
  await sendCommand("on-offline-mode");

export const deleteProfileById = async <T = any>(id: number): Promise<T> =>
  await sendCommand("deleteProfileById", { id });

export const updateProfileUserName = async <T = any>(value: {
  id: number;
  userName: string;
}): Promise<T> => await sendCommand("updateProfileUserName", value);

export const updateProfileIsHidden = async <T = any>(value: {
  id: number;
  isHidden: boolean;
}): Promise<T> => await sendCommand("updateProfileIsHidden", value);

export const setStatusBiometric = async <T = any>(status: boolean): Promise<T> =>
  await sendCommand("setStatusBiometric", {
    status,
  });

export const reloadProfile = async <T = any>(): Promise<T> => await sendCommand("reload-profile");

export const logout = async <T = any>(): Promise<T> => await sendCommand("logout");

export const getAllDApps = async <T = any>(): Promise<T[]> => await sendCommand("getAllDApps");

export const checkPinCodeHideDApp = async <T = { isCorrect: true }>(value: {
  pinCodeHideDApp: string;
  id: number;
}): Promise<T> => await sendCommand("checkPinCodeHideDApp", value);

export const getAllHiddenDApps = async <T = any>(): Promise<T> =>
  await sendCommand("getAllHiddenDApps");

export const getAllHiddenWallets = async () => await sendCommand("getAllHiddenWallets");

export const searchWallet = async (value: { query: string }) =>
  await sendCommand("searchWallet", value);

export const updateWalletIsHidden = async (value: { address: string; isHidden: boolean }) =>
  await sendCommand("updateWalletIsHidden", value);

export const getCurrentLocation = async () => {
  return await sendCommand("get-current-location");
};
export const fetchDataFromURL = async (url: string) =>
  await sendCommand("fetch-data-from-url", { url });

export const createFileWithExt = async (name: string, content: any, ext: string, folder: string) =>
  await sendCommand("create-file-with-ext", { name, content, ext, folder });

export const getPlatform = async () => await sendCommand("getPlatform");

export const createWalletWithoutConfirm = async () =>
  await sendCommand("createWallet", { isSaved: false });

export const createECDHPassword = async <T = { password: string }>(
  publicKey: string,
  privateKey: string,
): Promise<T> => await sendCommand("createECDHPassword", { publicKey, privateKey });

export const encryptAESGCM = async (sharedSecret: string, plainText: string) =>
  await sendCommand("encryptAESGCM", { sharedSecret, plainText });

export const getDeviceInfo = async () => await sendCommand("getDeviceInfo");

export const getBlockNumber = async (): Promise<any> => await sendCommand("getBlockNumber");
interface GetBlockParams {
  block?: number | string | "earliest" | "latest" | "pending";
  txObjects?: boolean;
}

export const getBlockByNumber = async ({ block = "latest", txObjects = false }: GetBlockParams) => {
  return await sendCommand("getBlockByNumber", { block, txObjects });
};

export const getTransactionByHash = async (txHash: string) => {
  return await sendCommand("getTransactionByHash", txHash);
};

export const createWalletFast = async (isSaved: boolean = false) =>
  await sendCommand("createWallet", { isSaved });

export const createFileWithBuffer = async (
  name: string,
  folder: string,
  ext: string,
  buffer: any,
) =>
  await sendCommand("create-file-with-buffer", {
    name,
    folder,
    ext,
    buffer,
  });

export const writeHexToFile = async (hex: string, ext: string, isBase64: boolean) =>
  await sendCommand("writeHexToFile", { hex, ext, isBase64 });
export const scanIDCard = async (data: {
  documentNumber: any;
  dateOfBirth: any;
  dateOfExpiry: any;
}) => await sendCommand("scanIDCard", data);

export const handleRequestPermission = async (permission: Permission) => {
  const status = await checkPermission(permission);
  if (status !== 1) {
    const granted = await requestPermission(permission);
    if (!granted) throw new Error("Contact permission denied");
  }
  return true;
};

export const openEkyc = async (frontCardUrl: string) => {
  return await sendCommand("open-ekyc", {
    token: "token string here",
    frontCardUrl,
  });
};

export const openDapp = async <T = Dapp>(value: T) => await sendCommand("open-dapp", value);

export const updateAppsIsStore = async () => await sendCommand("updateAppsIsStore");

export const importSharedDataToDApp = async () => await sendCommand("import-shared-data-to-d-app");

export const checkExistsShareData = async () => await sendCommand("check-exists-share-data");

export const closeWallets = async () => await sendCommand("close-wallets");

export const openWalletDetail = async (address: string) =>
  await sendCommand("open-wallet-detail", { address });

export const openCreateVisa = async () => await sendCommand("openCreateVisa");

export const encryptAesECDHByPassword = async (password: string, message: string) =>
  await sendCommand("encryptAesECDHByPassword", { password, message });

export const decryptAesECDH = async (publicKey: string, address: string, message: string) =>
  await sendCommand("decryptAesECDH", { publicKey, address, message });

export const decryptAesECDHByPassword = async (password: string, message: string) =>
  await sendCommand("decryptAesECDHByPassword", { password, message });

export const GetOpenKeyCurrentModeAsync = async () =>
  await sendCommand("GetOpenKeyCurrentModeAsync");

export const CheckOpenKeyExists = async <T = { isExist: boolean }>(): Promise<T> =>
  await sendCommand("CheckOpenKeyExists");

export const showAssistiveTouch = async () => await sendCommand("showAssistiveTouch");
export const goBack = async () => await sendCommand("goBack");
export const hideSearchHome = async () => await sendCommand("hide-search-home");

export const startVoiceSearch = async () => await sendCommand("startVoiceSearch");

export const showAIAssistant = async () => await sendCommand("showAIAssistant");

export const searchDApp = async (name: string) => await sendCommand("searchDApp", { name });

export const searchContacts = async (keySearch: string) =>
  await sendCommand("searchContacts", { keySearch });

export const getSuggestionWebSearch = async (keySearch: string) =>
  await sendCommand("getSuggestionWebSearch", { keySearch });

export const searchFeatureInSettings = async (keySearch: string) =>
  await sendCommand("searchFeatureInSettings", { keySearch });

export const searchContentInReminders = async (keySearch: string) =>
  await sendCommand("searchContentInReminders", { keySearch });

export const openAppFromSearch = async (bundleId: string, urlSuffix = "") =>
  await sendCommand("openAppFromSearch", {
    bundleId,
    urlSuffix,
  });

export const getSuggestionApps = async (limit: number) => {
  const rs = await sendCommand("getSuggestionApps", { limit });
  return rs;
};

export const openUrl = async (url: string) => await sendCommand("open-url", { url });

export const getRecentWindows = async () => await sendCommand("getRecentWindows");

export const getFocusedWindow = async (): Promise<{ windowId: string }> =>
  await sendCommand("getFocusedWindow");

export const focusWindow = async (windowId: string) =>
  await sendCommand("focusWindow", { windowId });
export const encryptAesECDH = async (
  publicKey: string,
  address: string,
  message: string,
): Promise<{ value: string; publicKeyLocal: string }> =>
  await sendCommand("encryptAesECDH", { publicKey, address, message });

export const getFCMToken = async () => await sendCommand("getFCMToken");

export const createSignECDH = async ({
  privateKey,
  message,
  hash,
}: {
  privateKey: string;
  message?: string;
  hash?: string;
}) => await sendCommand("createSignECDH", { privateKey, message, hash });

export const getAvailableTimeZones = async () => await sendCommand("getAvailableTimezones");

export const setTimeZone = async (timeZoneId: string) =>
  await sendCommand("setTimezone", { timeZoneId });

export const syncTime = async () => await sendCommand("syncTime");

export const setDateTimeFormat = async (shortDateFormat: string, timeFormat: string) =>
  await sendCommand("setDateTimeFormat", { shortDateFormat, timeFormat });

export const getCurrentTimeZone = async () => await sendCommand("getCurrentTimeZone");

export const getCurrentRegion = async () => await sendCommand("getCurrentRegion");

export const sendMessageToServer = async (message: string) =>
  await sendCommand("send-message-to-server", { message });

export const getListIP = async () => await sendCommand("get-list-ip");

export const listenMessageFromClient = async () => await sendCommand("on-message-from-client");

export const stopListenMessageFromClient = async () => await sendCommand("close-client-socket");

export const getColorContrastFromImage = async (path: string) =>
  await sendCommand("getColorContrastFromImage", { path });

export const loginProfile = async (
  data:
    | {
        id: number;
        password: string;
        isAuth?: boolean;
      }
    | { userName: string; password: string },
) => await sendCommand("loginProfile", data);

export const cancelShare = async () => await sendCommand("cancel-share");

export const createFileWithBase64 = async <T = { path: string }>(value: {
  base64: string;
  name: string;
  ext: string;
}): Promise<T> =>
  await sendCommand("create-file-with-base64", {
    ...value,
    base64: value.base64.replace(/^data:image\/\w+;base64,/, ""),
  });

export const createFileWithUrl = async (value: {
  url: string;
  name: string;
  ext: string;
}): Promise<string> => {
  const res = await sendCommand("create-file-with-url", value);
  return `image://img.m.pro/${res.path}`;
};

export const unzipFileRestore = async (path: string, password: string) =>
  await sendCommand("unzip-file-restore", { path, password });

export const deleteInactiveNotifications = async (bundleId: string) =>
  await sendCommand("deleteInactiveNotifications", { bundleId });

export const openProfileNoti = async (value: {
  key: string;
  fromCenter: boolean;
  profileId: number;
}) => await sendCommand("open-profile-noti", value);

export const notificationGetUserOnesByProfile = async (profileId: number) =>
  await sendCommand("notificationGetUserOnesByProfile", { profileId });

export const setWifiStatus = async (isEnabled: boolean) =>
  await sendCommand("setWifiStatus", { isEnabled });

export const checkWifiStatus = async <T = { isEnabled: true }>(): Promise<T> =>
  await sendCommand("checkWifiStatus");

export const scanAvailableWifi = async () => await sendCommand("scanAvailableWifi");

export const connectToWifi = async (ssid: string, password?: string) =>
  await sendCommand("connectToWifi", { ssid, password });

export const forgetWifi = async (ssid: string) => await sendCommand("forgetWifi", { ssid });

export const disconnectToWifi = async () => await sendCommand("disconnectToWifi");

export const lock = async () => await sendCommand("lock");

export const logOff = async () => await sendCommand("logOff");

export const shutdown = async () => await sendCommand("shutdown");

export const restart = async () => await sendCommand("restart");

export const sleep = async () => await sendCommand("sleep");

export const setBluetoothStatus = async (isEnabled: boolean) =>
  await sendCommand("setBluetoothStatus", { isEnabled });

export const checkBluetoothStatus = async <
  T = { isSupported: boolean; isEnabled: boolean },
>(): Promise<T> => await sendCommand("checkBluetoothStatus");

export const scanBluetoothDevices = async () => await sendCommand("scanBluetoothDevices");

export const stopScanBluetoothDevices = async () => await sendCommand("stopScanBluetoothDevices");

export const watchPairedBluetoothDevices = async () =>
  await sendCommand("watchPairedBluetoothDevices");

export const unwatchPairedBluetoothDevices = async () =>
  await sendCommand("unwatchPairedBluetoothDevices");

export const pairBluetoothDevice = async (deviceId: string) =>
  await sendCommand("pairBluetoothDevice", { deviceId });

export const connectToBluetoothDevice = async (deviceId: string) =>
  await sendCommand("connectToBluetoothDevice", { deviceId });

export const disconnectToBluetoothDevice = async (deviceId: string) =>
  await sendCommand("disconnectToBluetoothDevice", { deviceId });

export const openNotificationSettings = async (value: { bundleId: string; isEnabled: number }) =>
  await sendCommand("openNotificationSettings", value);

export const updateDAppSilentUntilTime = async (value: { time: number; bundleId: string }) =>
  await sendCommand("updateDAppSilentUntilTime", value);

export const shareDataToDApp = async (value: { bundleId: string; profileId: string }) =>
  await sendCommand("share-data-to-d-app", value);

export const getAllDAppsAndFrames = async () => await sendCommand("getAllDAppsAndFrames");

export const musicTogglePause = async () => await sendCommand("musicTogglePause");

export const musicNavigateToPrevious = async () => await sendCommand("musicNavigateToPrevious");

export const musicNavigateToNext = async () => await sendCommand("musicNavigateToNext");

export const musicGetServiceInfo = async () => await sendCommand("musicGetServiceInfo");

export const backupData = async (password: string) =>
  await sendCommand("backup-data", { password });

export const restoreData = async (path: string, isReplace?: boolean) =>
  await sendCommand("restoreData", { path, isReplace });

export const deleteFile = async (path: string) => await sendCommand("delete-file", { path });

export const deleteListDAppById = async (dApps: number[]) =>
  await sendCommand("deleteListDAppById", { dApps });

export const cloneDApp = async (dApps: number[], isSharedData: boolean) =>
  await sendCommand("cloneDApp", { dApps, isSharedData });

export const updatePinCodeHideDApp = async (value: {
  id: number;
  pinCodeHideDApp: string;
  pinCodeHideDAppConfirm: string;
}) => await sendCommand("updatePinCodeHideDApp", value);

export const updateDAppIsHidden = async (value: { isHidden: number; dApps: number[] }) =>
  await sendCommand("updateDAppIsHidden", value);

export const updatePasswordLockDApp = async (value: {
  id: number;
  passwordLockDApp: string;
  passwordLockDAppConfirm: string;
}) => await sendCommand("updatePasswordLockDApp", value);

export const checkPasswordLockDApp = async (value: { id: number; passwordLockDApp: string }) =>
  await sendCommand("checkPasswordLockDApp", value);

export const checkPassword = async (id: number, password: string) =>
  await sendCommand("checkPassword", { id, password });

export const updatePassword = async (value: {
  id: number;
  password: string;
  passwordConfirm: string;
}) => await sendCommand("updatePassword", value);

export const updateDAppIsLocked = async (value: { isLocked: number; dApps: number[] }) =>
  await sendCommand("updateDAppIsLocked", value);

export const shareDApp = async (dApps: number[]) => await sendCommand("shareDApp", { dApps });

export const deleteDataDApp = async (value: Dapp[]) =>
  await sendCommand("deleteDataDApp", {
    data: value,
  });

export const updateProfileLockScreenDisplayType = async (id: any, type: any) =>
  await sendCommand("updateProfileLockScreenDisplayType", { id, type });

export const updateProfileIsProtected = async (value: { isProtected: boolean; id: number }) =>
  await sendCommand("updateProfileIsProtected", value);

export const switchAccount = async (id: number) => await sendCommand("switchAccount", { id });

export const getDAppByBundleId = async (bundleId: string) =>
  await sendCommand("getDAppByBundleId", { bundleId });

export const updateProfile = async (value: IInsertProfile) =>
  await sendCommand("updateProfile", value);

export const updateDAppIsIncludeOnly = async (value: { bundleId: string; isIncludeOnly: number }) =>
  await sendCommand("updateDAppIsIncludeOnly", value);

export const requestBiometric = async () => await sendCommand("requestBiometric");

export const expandMusic = async (isExpand: boolean) =>
  await sendCommand("expand-music", { isExpand });

export const pausePlayVideo = async (isPause: boolean) =>
  await sendCommand("pausePlayVideo", { isPause });

export const showMimiVideo = async (value: {
  url: string;
  title: string;
  duration: string;
  isLive: boolean;
}) => await sendCommand("showMimiVideo", value);

export const getSharedDApps = async () => await sendCommand("getSharedDApps");

export const checkIsOnline = async () => await sendCommand("check-is-online");

export const getDAppToShare = async () => await sendCommand("getDAppToShare");

export const getDisplays = async () => await sendCommand("getDisplays");
export const setPrimary = async (value: { id?: string }) => await sendCommand("setPrimary", value);

export const changeDisplayMode = async (action: number) =>
  await sendCommand("changeDisplayMode", { action });

export const moveDisplay = async (value: {
  displayName: string;
  direction: "left" | "right" | "top" | "bottom";
}) => await sendCommand("moveDisplay", value);

export const indentity = async () => await sendCommand("indentity");

export const exitAndReloadParent = async () => await sendCommand("exit-and-reload-parent");

export const getSmartContractAddress = async (address: string) => {
  const result = await sendCommand("getSmartContractAddress", { address });
  return result.address;
};

export const subscribeToAddress = async (value: { fromAddress: string; toAddress: string }) =>
  await sendCommand("subscribeToAddress", value);

export const decodeAbi = async (value: {
  rawInput: string;
  outputs: unknown[];
  functionName: string;
}) => (await SystemCore.send({ command: "decodeAbi", value })).data;

export const openDefaultBrowser = async (url: string) => {
  await sendCommand("open-default-browser", { url });
};

export const startCallRTC = async (
  caller: string,
  callee: string,
  type: "call" | "receive",
  roomId: string,
) =>
  await sendCommand("startCallRTC", {
    query: `caller=${caller}&callee=${callee}&type=${type}&roomId=${roomId}`,
  });

export const registerWebRTCIce = async (iceServers: string[]) => {
  const rs = await sendCommand("registerWebRTCIce", { iceServers });
  return rs?.sdp;
};

export const setAnswerSDP = async (answerSdp: string) =>
  await sendCommand("setAnswerSDP", { sdp: answerSdp });

export const endCall = async () => await sendCommand("endCall");

export const setOfferSDP = async (sdp: string, iceServers: string[]) =>
  (await sendCommand("setOfferSDP", { sdp, iceServers }))?.sdp;

export const switchCamera = async (): Promise<void> => await sendCommand("switchCamera");
export const muteMic = async (): Promise<void> => await sendCommand("muteMic");
export const unmuteMic = async (): Promise<void> => await sendCommand("unmuteMic");
export const isMicMuted = async (): Promise<boolean> => await sendCommand("isMicMuted");

export const turnOffCamera = async (): Promise<void> => await sendCommand("turnOffCamera");
export const turnOnCamera = async (): Promise<void> => await sendCommand("turnOnCamera");
export const isCameraOn = async (): Promise<boolean> => await sendCommand("isCameraOn");

export const updateMetaInputPosition = async (rect: object) =>
  await sendCommand("updateMetaInputPosition", { ...rect });
export const registerExtendComponent = async (info: object) =>
  await sendCommand("registerExtendComponent", { ...info });
export const showExtendComponent = async (info: object) =>
  await sendCommand("showExtendComponent", { ...info });
export const hideExtendComponent = async (info: object) =>
  await sendCommand("hideExtendComponent", { ...info });
export const sendMessageFromExtendComponentToParent = async (messageInfo: object) =>
  await sendCommand("sendMessageFromExtendComponentToParent", { ...messageInfo });
export const sendEventToExtend = async (messageInfo: object) =>
  await sendCommand("sendEventToExtend", { ...messageInfo });

export const createHashWithBuffer = async (value: { buffer: number[] }) =>
  await sendCommand("createHashWithBuffer", value);

export const getAllMediaSources = async <T = string[]>() =>
  (await sendCommand("getAllMediaSources")) as T;

export const getMediaBySource = async <T = unknown>(value: {
  source: string;
  page: number;
  pageSize: number;
}) => (await sendCommand("getMediaBySource", value)) as T;

export const getMediaYears = async <T = unknown>() => (await sendCommand("getMediaYears")) as T;
export const getMediaByDay = async <T = unknown>(value: {
  year: number;
  month: number;
  day: number;
  page: number;
  pageSize: number;
}) => (await sendCommand("getMediaByDay", value)) as T;
export const getMediaMonths = async <T = unknown>(value: { year?: number }) =>
  (await sendCommand("getMediaMonths", value)) as T;
export const getMediaByPage = async <T = unknown>(value: { page: number; pageSize: number }) =>
  (await sendCommand("getMediaByPage", value)) as T;

export const connectQuicServer = async (ip: string, port: number, alpn: string) =>
  await sendCommand("connectQuicServer", { ip, port, alpn });

export const disconnectQuicServer = async (ip: string, port: number, alpn: string) =>
  await sendCommand("disconnectQuicServer", { ip, port, alpn });

export const sendQuicMessage = async (ip: string, port: number, alpn: string, payload: string) =>
  await sendCommand("sendQuicMessage", { ip, port, alpn, payload });
