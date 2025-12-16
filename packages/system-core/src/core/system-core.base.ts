import type {
  BaseTransport,
  RequestMessage,
  ResponseMessage,
  SystemMessageOptions,
} from "@metanodejs/system-message";
import {
  ElectronAPITransport,
  NativeBridgeTransport,
  PostMessageTransport,
  SystemMessage,
} from "@metanodejs/system-message";
import { isElectron, isMetanodeWebView } from "../utils/detect-environment";
import { generateMesageId } from "../utils/ids";

export interface SystemCoreBaseOptions extends SystemMessageOptions {
  targetWindow?: Window;
  origin?: string;
  debug?: boolean;
  timeout?: number;
}

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

export class SystemCoreBase {
  protected transport: BaseTransport;
  protected systemMessage: SystemMessage;
  private pendingRequests = new Map<string, PendingRequest>();

  constructor(private config: SystemCoreBaseOptions) {
    this.transport = this.initTransport();
    this.systemMessage = new SystemMessage(this.transport, config);

    this.listenMessage();
  }

  public async send<T = unknown>(payload: Omit<RequestMessage, "messageId">): Promise<T> {
    const messageId = generateMesageId();
    const command = payload.command;
    if (!command) {
      throw new Error("RequestMessage must have 'command' property");
    }
    const message = {
      ...payload,
      messageId,
      metadata: {
        timestamp: Date.now(),
        source: this.transport.source,
      },
    } as RequestMessage; // type assertion ở đây
    // Tạo promise và lưu vào map để chờ response
    const promise = new Promise<T>((resolve, reject) => {
      const key = `${command}-${messageId}`;
      this.pendingRequests.set(key, { resolve, reject });
      // Optional: timeout để tránh leak memory nếu không có response
      setTimeout(() => {
        if (this.pendingRequests.has(key)) {
          this.pendingRequests.delete(key);
          reject(new Error(`Timeout waiting for response to command: ${command}`));
        }
      }, this.config.timeout ?? 30_000); // 30 giây timeout, có thể config được
    });
    // Gửi message đi
    this.systemMessage.send(message);
    return promise;
  }

  public destroy() {
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error("SystemCore destroyed"));
    });
    this.pendingRequests.clear();
    // Nếu SystemMessage có phương thức destroy/off thì gọi ở đây
  }

  private listenMessage() {
    this.systemMessage.on((event: ResponseMessage) => {
      // Giả sử ResponseMessage có command và messageId giống request
      // (thường thì bên nhận sẽ copy lại command + messageId từ request)
      const { command, messageId, success, data, message } = event;

      if (!command || !messageId) {
        console.warn("[SystemCore] Received response without command or messageId", event);
        return;
      }
      const key = `${command}-${messageId}`;
      const pending = this.pendingRequests.get(key);
      if (pending) {
        this.pendingRequests.delete(key);
        if (success) {
          pending.resolve(data);
        } else {
          pending.reject(new Error(message || "Request failed"));
        }
      } else {
        // Có thể là response không được chờ (hoặc push notification)
        console.log("[SystemCore] Received unsolicited response:", event);
      }
    });
  }

  private initTransport(): BaseTransport {
    const debug = !!this.config.debug;

    if (isMetanodeWebView()) {
      return new NativeBridgeTransport(debug);
    }

    if (isElectron()) {
      return new ElectronAPITransport(debug);
    }

    if (typeof window !== "undefined") {
      if (!this.config.targetWindow) {
        throw new Error("PostMessageTransport requires targetWindow");
      }
      return new PostMessageTransport(this.config.targetWindow, this.config.origin ?? "*", debug);
    }

    throw new Error("Unsupported runtime environment");
  }
}
