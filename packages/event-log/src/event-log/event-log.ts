import { SystemCore, subscribeToAddress } from "@metanodejs/system-core";
import { IDecodeAbiRepository } from "../decode-abi/types";
import { EventLogData, EventMap, IEventLogRepository } from "./types";

/**
 * Raw event payload from SystemCore
 */
interface EventLogPayload {
  topics?: Record<string, string>;
  data?: string;
}

type Listener<T> = (payload: T) => void;
type GlobalListener<TEvents extends EventMap> = <K extends keyof TEvents & string>(
  data: EventLogData<K, TEvents[K]>,
) => void;

export class EventLog<TEvents extends EventMap> implements IEventLogRepository<TEvents> {
  /** per-event listeners */
  private readonly listeners = new Map<keyof TEvents & string, Set<Listener<any>>>();

  /** global listeners */
  private readonly globalListeners = new Set<GlobalListener<TEvents>>();

  /** system state */
  private systemAttached = false;

  constructor(private readonly decodeAbi: IDecodeAbiRepository) {}

  /**
   * Register addresses to listen logs from blockchain
   */
  async registerEvent(from: string, to: string[]): Promise<void> {
    if (!from || !to?.length) {
      throw new Error("Bạn chưa đăng nhập nên chưa thể lắng nghe!");
    }

    await Promise.all(
      to.map((toAddress) =>
        subscribeToAddress({
          fromAddress: from,
          toAddress,
        }),
      ),
    );
    console.info(
      `🛰️ [EVENT REGISTER]
      From: ${from}
      To  : ${to.join(", ")}`,
    );
  }

  /**
   * Listen ALL decoded events (global)
   */
  onEventLog(callback: GlobalListener<TEvents>): () => void {
    this.attachSystemCore();

    this.globalListeners.add(callback);

    return () => {
      this.globalListeners.delete(callback);
      this.tryDetachSystemCore();
    };
  }

  /**
   * Listen specific event by name
   *
   * @example
   * eventLog.on("Transfer", payload => {})
   */
  on<K extends keyof TEvents & string>(event: K, callback: Listener<TEvents[K]>): () => void {
    this.attachSystemCore();

    const set = this.listeners.get(event) ?? new Set<Listener<TEvents[K]>>();

    set.add(callback);
    this.listeners.set(event, set);

    return () => {
      set.delete(callback);

      if (set.size === 0) {
        this.listeners.delete(event);
      }

      this.tryDetachSystemCore();
    };
  }

  /**
   * Attach SystemCore listener once
   */
  private attachSystemCore() {
    if (this.systemAttached) return;

    SystemCore.on("EventLogs", this.handleSystemEvent);
    this.systemAttached = true;
  }

  /**
   * Detach SystemCore if no listeners remain
   */
  private tryDetachSystemCore() {
    if (this.listeners.size === 0 && this.globalListeners.size === 0 && this.systemAttached) {
      SystemCore.removeEventListener("EventLogs", this.handleSystemEvent);
      this.systemAttached = false;
    }
  }

  /**
   * SystemCore raw event handler
   */
  private readonly handleSystemEvent = async (raw: unknown) => {
    console.log("LISTEN EVENT NATIVE RAW -----", raw);
    const events = this.normalizeEvents(raw);
    if (!events.length) return;

    for (const event of events) {
      const topic0 = event.topics?.["0"];
      if (!topic0) continue;

      try {
        const decoded = await this.decodeAbi.decodeAbi(topic0, event.data ?? "", event.topics);

        const eventName = decoded.event as keyof TEvents & string;

        const payload = decoded.decodedData as TEvents[typeof eventName];

        // emit global
        for (const listener of this.globalListeners) {
          listener({ type: eventName, payload });
        }

        // emit per-event
        this.emit(eventName, payload);
      } catch (error) {
        console.warn("[EVENT LOG] Decode failed", error);
      }
    }
  };

  /**
   * Emit event to per-event listeners
   */
  private emit<K extends keyof TEvents & string>(event: K, payload: TEvents[K]) {
    const listeners = this.listeners.get(event);
    if (!listeners) return;

    for (const listener of listeners) {
      listener(payload);
    }
  }

  /**
   * Normalize SystemCore payload
   */
  private normalizeEvents(input: unknown): EventLogPayload[] {
    if (Array.isArray(input)) {
      return input as EventLogPayload[];
    }

    if (typeof input === "object" && input !== null && Array.isArray((input as any).data)) {
      return (input as any).data as EventLogPayload[];
    }

    return [];
  }
}
