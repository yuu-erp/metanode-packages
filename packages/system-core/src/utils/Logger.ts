type LogLevel = "debug" | "info" | "warn" | "error" | "log";

export class Logger {
  private readonly isDev: boolean;
  private readonly prefix: string;

  constructor(prefix = "") {
    this.isDev = process.env.NODE_ENV !== "production";
    this.prefix = prefix;
  }

  private formatMessage(level: LogLevel, args: any[]): any[] {
    const timestamp = new Date().toISOString();
    return [`[${timestamp}] [${level.toUpperCase()}] ${this.prefix}`, ...args];
  }

  debug(...args: any[]) {
    if (this.isDev) {
      console.debug(...this.formatMessage("debug", args));
    }
  }

  info(...args: any[]) {
    if (this.isDev) {
      console.info(...this.formatMessage("info", args));
    }
  }

  warn(...args: any[]) {
    if (this.isDev) {
      console.warn(...this.formatMessage("warn", args));
    }
  }

  error(...args: any[]) {
    if (this.isDev) {
      console.error(...this.formatMessage("error", args));
    }
  }

  log(...args: any[]) {
    if (this.isDev) {
      console.log(...this.formatMessage("log", args));
    }
  }
}
