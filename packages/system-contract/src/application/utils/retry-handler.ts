import { ExponentialBackoff } from "./backoff";

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  backoffFactor: number;
}

export class RetryHandler {
  private config: RetryConfig = {
    maxRetries: 5,
    baseDelayMs: 500,
    backoffFactor: 2,
  };

  configure(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    const backoff = new ExponentialBackoff(this.config.baseDelayMs, this.config.backoffFactor);

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === this.config.maxRetries) {
          throw error;
        }

        const delay = backoff.nextDelay();
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}
