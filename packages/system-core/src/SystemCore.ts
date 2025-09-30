import { type PayloadDto } from "./dtos/payload.dto";
import { type ServiceResponseDto } from "./dtos/service-response.dto";
import { isEmpty, splitDataIntoChunks } from "./utils";
import { EventEmitter } from "./utils/EventEmitter";
import { generateMesageId } from "./utils/ids";
import { Logger } from "./utils/Logger";

const MESSAGE_SIZE_LIMIT = 24000;
interface ReceiveData {
  [key: string]: any; // Define the type of expected commands and their values
}
class SystemCore extends EventEmitter {
  #pendingCommands = new Set<string>();
  #finSdk: typeof window.finSdk | undefined;
  #receiveLargeData: any = {};
  #logger = new Logger("[SystemCore]");
  #receiveData: ReceiveData = {};
  constructor() {
    super();
    this.#finSdk = window.finSdk;
    this.#subscribe();
    this.#logger.info("SystemCore initialized");
  }

  public getAppId() {
    if (!window.electronAPI) return window.appId;
    return window.electronAPI.windowId ?? window.appId;
  }

  public async send(payload: PayloadDto) {
    payload.messageId = generateMesageId();
    if (window.appId) {
      payload.appId = window.appId;
    }
    const windowId = this.#getWindowId();
    if (windowId) {
      payload.windowId = windowId;
    }
    const commandID = `${payload.command}_${payload.messageId}`;
    this.#receiveData[commandID] = -1;
    await this.#sendMessageToNative(payload);

    const response: any = await this.#postMessageToWindow(payload, commandID);
    if (response.success || response?.data?.success) {
      return response;
    }
    if (!isEmpty(response.data)) throw response.data;
    throw response;
  }

  #getWindowId() {
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    // Ưu tiên: Nếu windowId có trong window.location.search
    if (searchParams.has("windowId")) {
      return searchParams.get("windowId");
    }
    // Nếu không có, kiểm tra phần hash (nếu có chứa query string)
    if (hash.includes("?")) {
      const hashQuery = hash.split("?")[1];
      const hashParams = new URLSearchParams(hashQuery);
      if (hashParams.has("windowId")) {
        return hashParams.get("windowId");
      }
    }
    // Nếu không tìm thấy
    return null;
  }

  #sendChunks(command: string, data: string, isFrame = false) {
    if (!command || typeof command !== "string") {
      throw new Error("Command must be a valid string");
    }

    const chunks = splitDataIntoChunks(data, MESSAGE_SIZE_LIMIT);
    this.#logger.debug(`Sending ${chunks.length} chunks for command: ${command}`);
    chunks.forEach(({ chunk, index, totalChunks }) => {
      const payload = {
        type: "large",
        chunk,
        index,
        totalChunks,
        command,
      };
      const message = JSON.stringify(payload);
      this.#postMessage(message, isFrame);
    });
  }

  #sendMessageToNative(payload: PayloadDto) {
    try {
      const message = JSON.stringify(payload);
      if (message.length > MESSAGE_SIZE_LIMIT) {
        this.#logger.warn("Message too large, splitting into chunks", message);
        this.#sendChunks(payload.command, message);
      } else {
        const payload = {
          type: "normal",
          data: message,
        };
        const messageNormal = JSON.stringify(payload);
        this.#postMessage(messageNormal);
      }
    } catch (error) {
      this.#logger.error("Error sending message:", error);
    } finally {
      this.#pendingCommands.delete(payload.command.toString());
    }
  }

  #postMessage(message: string, isFrame = false) {
    try {
      if (isFrame) {
        window.parent.postMessage(message, window.origin);
      } else if (window.webkit?.messageHandlers?.callbackHandler?.postMessage) {
        window.webkit.messageHandlers.callbackHandler.postMessage(message);
      } else if (window.electronAPI && typeof window.electronAPI.sendMessage === "function") {
        window.electronAPI.sendMessage("native", message);
      } else if (this.#finSdk) {
        const messageParse = JSON.parse(message);
        const dataParse = JSON.parse(messageParse.data);
        this.#finSdk.call(dataParse);
      } else {
        this.#logger.warn("WebKit handler not found");
        throw new Error("WebKit handler not found");
      }
    } catch (error) {
      this.#logger.error("Error posting message:", error);
      throw error;
    }
  }

  #postMessageToWindow<T>(payload: PayloadDto, commandID: string): Promise<ServiceResponseDto<T>> {
    return new Promise((resolve) => {
      if (this.#receiveData[commandID] === -1) {
        this.#receiveData[commandID] = { resolve };
      }
      window.opener?.postMessage(payload, "*");
    });
  }

  #handleMessage(data: unknown | any) {
    if (!data) return;
    const type = data.type ?? "normal";
    if (type === "webpackOk") return;
    if (data && data.data && data.data.cmd) {
      this.emit("listen-cmd", data.data);
      return;
    }
    let receiveMessage: any;
    if (type === "normal") {
      receiveMessage = typeof data === "string" && data.includes("{") ? JSON.parse(data) : data;
    } else if (type === "large") {
      const { chunk, totalChunks, command } = data;
      if (!this.#receiveLargeData[command]) {
        this.#receiveLargeData[command] = {
          expectedChunks: totalChunks,
          receivedData: "",
          receivedChunks: 0,
        };
      }
      this.#receiveLargeData[command].receivedData += chunk;
      this.#receiveLargeData[command].receivedChunks += 1;

      if (this.#receiveLargeData[command].receivedChunks !== totalChunks) return;
      receiveMessage = JSON.parse(this.#receiveLargeData[command].receivedData);
      delete this.#receiveLargeData[command];
    } else {
      receiveMessage = data;
    }
    if (data.cmd) {
      this.emit("listen-cmd", data);
      return;
    }
    if (!receiveMessage || Object.keys(receiveMessage).length === 0) return;
    if (receiveMessage.command === "executeSmartContract") {
      this.#logger.debug("KHAIHOAN - receiveMessage:", receiveMessage);
    }
    const command = receiveMessage?.data?.command ?? receiveMessage.command;
    const messageId = receiveMessage?.data?.messageId ?? receiveMessage.messageId;
    const isSocket = receiveMessage?.data?.isSocket ?? receiveMessage.isSocket;
    const commandID = messageId ? `${command}_${messageId}` : command;
    // Nếu isSocket = true thì native đang trả về bằng socket còn isSocket = false thì đã trả về trực tiếp
    if (typeof isSocket === "boolean" && isSocket) {
      return this.emit(command, receiveMessage.data);
    }
    // ở hàm #postMessageToWindow đã gán this.#receiveData[commandID] = { resolve } để trả kết quả về dựa vào command và messageId ( commandID ) ở đây
    const messageSending = this.#receiveData[commandID];
    if (messageSending && typeof messageSending.resolve === "function") {
      messageSending.resolve(receiveMessage.data);
      delete this.#receiveData[commandID];
    }
  }

  #subscribe() {
    window.addEventListener("flutterInAppWebViewPlatformReady", () => {
      this.#logger.info("flutterInAppWebViewPlatformReady detected, system ready");
    });

    window.require?.("electron")?.ipcRenderer.on("message", (_event: any, ...args: any[]) => {
      if (args[0]) {
        window.postMessage(args[0], "*");
      } else {
        window.postMessage(args, "*");
      }
    });

    window.addEventListener("message", (event: MessageEvent<unknown>) => {
      const { data } = event;
      this.#handleMessage(data);
    });

    if (window.electronAPI && typeof window.electronAPI.onMessage === "function") {
      // @ts-ignore
      window.electronAPI.onMessage("fromNative", (data: unknown[]) => {
        let message = data[0];
        if (typeof message === "string") {
          message = JSON.parse(message);
        }
        this.#handleMessage(message);
      });
    }
  }
}

const core = new SystemCore();
export { core as SystemCore };
