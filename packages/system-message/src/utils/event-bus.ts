type Callback = (data: any) => void;

export class SimpleEventBus {
  private listeners: Map<string, Callback[]> = new Map();

  on(event: string, callback: Callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      // clone mảng để tránh lỗi khi callback tự remove
      [...callbacks].forEach((cb) => cb(data));
    }
  }

  off(event: string, callback?: Callback) {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      this.listeners.set(
        event,
        callbacks.filter((cb) => cb !== callback),
      );
    }
  }
}
