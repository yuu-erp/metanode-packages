import { SystemCore, subscribeToAddress } from "@metanodejs/system-core";
import { IDecodeAbiRepository } from "../decode-abi/types";
import { EventLogData, IEventLogRepository } from "./types";

/**
 * Raw event log từ SystemCore
 */
interface EventLogPayload {
  topics?: Record<string, string>;
  data?: string;
}

/**
 * EventLog repository
 */
export class EventLog implements IEventLogRepository {
  constructor(private readonly decodeAbi: IDecodeAbiRepository) {}

  /**
   * Đăng ký lắng nghe event log theo address
   */
  async registerEvent(from: string, to: string[]): Promise<void> {
    try {
      if (!from || !to?.length) {
        throw new Error("Bạn chưa đăng nhập nên chưa thể lắng nghe!");
      }

      console.log("REGISTER EVENT LOGS ---- ", to);

      await Promise.all(
        to.map((toAddress) => subscribeToAddress({ fromAddress: from, toAddress })),
      );
    } catch (error) {
      console.warn(
        "Lỗi khi bắt đầu lắng nghe event log:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  /**
   * Lắng nghe sự kiện log và giải mã dữ liệu
   */
  onEventLog(callback: (data: EventLogData) => void): () => void {
    const handler = async (raw: unknown) => {
      try {
        const events = this.normalizeEvents(raw);
        if (!events.length) return;

        for (const event of events) {
          const topic0 = event.topics?.["0"];
          const data = event.data ?? "";

          if (!topic0) {
            console.warn("Missing topic0, skip event:", event);
            continue;
          }

          try {
            const decoded = await this.decodeAbi.decodeAbi(topic0, data, event.topics);

            callback({
              type: decoded.event,
              payload: decoded.decodedData,
            });
          } catch (error) {
            console.warn(
              "[EVENT LOG] Decode failed",
              error instanceof Error ? error.message : error,
            );
          }
        }
      } catch (error) {
        console.error(
          "Error processing event logs:",
          error instanceof Error ? error.message : error,
        );
      }
    };

    SystemCore.on("EventLogs", handler);

    return () => {
      SystemCore.removeEventListener("EventLogs", handler);
    };
  }

  /**
   * Chuẩn hóa input từ SystemCore thành array EventLogPayload
   */
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
