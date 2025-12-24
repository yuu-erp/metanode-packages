export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LoggerOptions {
  enabled?: boolean;
  prefix?: string;
}

/**
 * Logger có thể tree-shake ở production.
 * Khi enabled=false, toàn bộ log được loại bỏ trong build.
 */
export class Logger {
  private readonly prefix: string;
  private readonly enabled: boolean;

  constructor(options?: LoggerOptions) {
    this.enabled = options?.enabled ?? false;
    this.prefix = options?.prefix ?? "SystemMessage";

    if (!this.enabled) {
      // ⚡ Gán stub methods => build tool sẽ loại bỏ luôn
      this.debug = this.info = this.warn = this.group = () => {};
      this.error = (...args: any[]) => console.error(...args);
    }
  }

  private format(level: LogLevel, ...args: any[]): any[] {
    const time = new Date().toISOString();
    return [`[${this.prefix}] [${level}] ${time}:`, ...args];
  }

  debug(...args: any[]) {
    console.debug(...this.format("debug", ...args));
  }

  info(...args: any[]) {
    console.info(...this.format("info", ...args));
  }

  warn(...args: any[]) {
    console.warn(...this.format("warn", ...args));
  }

  error(...args: any[]) {
    console.error(...this.format("error", ...args));
  }

  group(label: string, fn: () => void) {
    console.group(`[${this.prefix}] ${label}`);
    try {
      fn();
    } finally {
      console.groupEnd();
    }
  }
}
