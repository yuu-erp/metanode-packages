export interface TimeoutConfig {
  timeoutMs: number;
}

export class TimeoutHandler {
  private config: TimeoutConfig = { timeoutMs: 30000 };

  configure(config: Partial<TimeoutConfig>): void {
    this.config = { ...this.config, ...config };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Operation timed out after ${this.config.timeoutMs}ms`)),
          this.config.timeoutMs,
        ),
      ),
    ]);
  }
}
