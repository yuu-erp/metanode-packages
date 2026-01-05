/**
 * Map eventName -> payload type
 */
export type EventMap = Record<string, unknown>;

/**
 * Typed event data
 */
export interface EventLogData<TEvent extends string = string, TPayload = unknown> {
  type: TEvent;
  payload: TPayload;
}

/**
 * EventLog repository interface
 */
export interface IEventLogRepository<TEvents extends EventMap> {
  registerEvent(from: string, to: string[]): Promise<void>;

  /** listen tất cả event */
  onEventLog(
    callback: <K extends keyof TEvents & string>(data: EventLogData<K, TEvents[K]>) => void,
  ): () => void;

  /** listen từng event */
  on<K extends keyof TEvents & string>(
    event: K,
    callback: (payload: TEvents[K]) => void,
  ): () => void;
}
