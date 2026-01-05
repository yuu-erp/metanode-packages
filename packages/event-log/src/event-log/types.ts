export interface EventLogData {
  type: string;
  payload: unknown;
}
export interface IEventLogRepository {
  registerEvent(from: string, to: string[]): Promise<void>;
  onEventLog(callback: (data: EventLogData) => void): () => void;
}
