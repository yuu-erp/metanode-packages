export class LoggerTracer {
  private service: string;

  constructor({ service }: { service: string }) {
    this.service = service;
  }

  info(message: string, meta?: Record<string, any>): void {
    console.log(`[INFO] ${this.service} - ${message}`, meta);
  }

  debug(message: string, meta?: Record<string, any>): void {
    console.debug(`[DEBUG] ${this.service} - ${message}`, meta);
  }

  error(message: string, meta?: Record<string, any>): void {
    console.error(`[ERROR] ${this.service} - ${message}`, meta);
  }

  startSpan(
    name: string,
    attributes?: Record<string, any>,
  ): { end: (options?: { success?: boolean; error?: unknown }) => void } {
    console.log(`[SPAN START] ${name}`, attributes);
    return {
      end: (options) => {
        console.log(`[SPAN END] ${name}`, options);
      },
    };
  }
}
