import { SystemCore, subscribeToAddress } from "@metanodejs/system-core";
import { IDecodeAbiRepository } from "../decode-abi/types";
import { EventMap, EventLogData, IEventLogRepository } from "./types";

interface EventLogPayload {
  topics?: Record<string, string>;
  data?: string;
}

type Listener<T> = (payload: T) => void;

export class EventLog<TEvents extends EventMap> implements IEventLogRepository<TEvents> {
  private readonly listeners = new Map<keyof TEvents & string, Set<Listener<any>>>();

  constructor(private readonly decodeAbi: IDecodeAbiRepository) {}

  async registerEvent(from: string, to: string[]): Promise<void> {
    if (!from || !to?.length) {
      throw new Error("Bạn chưa đăng nhập nên chưa thể lắng nghe!");
    }

    await Promise.all(to.map((toAddress) => subscribeToAddress({ fromAddress: from, toAddress })));
  }

  /**
   * Listen all events
   */
  onEventLog(
    callback: <K extends keyof TEvents & string>(data: EventLogData<K, TEvents[K]>) => void,
  ): () => void {
    const handler = async (raw: unknown) => {
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
          callback({ type: eventName, payload });

          // emit per-event
          this.emit(eventName, payload);
        } catch (error) {
          console.warn("[EVENT LOG] Decode failed", error);
        }
      }
    };

    SystemCore.on("EventLogs", handler);
    return () => SystemCore.removeEventListener("EventLogs", handler);
  }

  /**
   * Listen specific event
   */
  on<K extends keyof TEvents & string>(
    event: K,
    callback: (payload: TEvents[K]) => void,
  ): () => void {
    const set = this.listeners.get(event) ?? new Set<Listener<TEvents[K]>>();

    set.add(callback);
    this.listeners.set(event, set);

    return () => {
      set.delete(callback);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /**
   * Emit event internally
   */
  private emit<K extends keyof TEvents & string>(event: K, payload: TEvents[K]) {
    const listeners = this.listeners.get(event);
    if (!listeners) return;

    for (const listener of listeners) {
      listener(payload);
    }
  }

  private normalizeEvents(input: unknown): EventLogPayload[] {
    if (Array.isArray(input)) {
      return input as EventLogPayload[];
    }

    if (
      typeof input === "object" &&
      input !== null &&
      Array.isArray((input as { data?: unknown }).data)
    ) {
      return (input as { data: EventLogPayload[] }).data;
    }

    return [];
  }
}
