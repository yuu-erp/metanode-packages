var f = { timeout: 15e3 },
  h = class {
    constructor(e, s) {
      this.chunkBuffer = new Map();
      ((this.logger = e), (this.options = { ...f, ...s }));
    }
    receiveChunk(e) {
      if (!e.type || e.type !== "large") return e;
      let { command: s, chunk: r, index: t, totalChunks: o } = e,
        n = `${s}`,
        i = this.chunkBuffer.get(n);
      if (
        (i ||
          ((i = {
            totalChunks: o,
            receivedChunks: 0,
            chunks: new Array(o),
            timer: setTimeout(() => {
              (this.logger.warn(`Timeout assembling message ${n}`), this.chunkBuffer.delete(n));
            }, this.options.timeout),
          }),
          this.chunkBuffer.set(n, i)),
        (i.chunks[t] = r),
        i.receivedChunks++,
        this.logger.debug(`[ChunkReceiver] Received chunk ${t + 1}/${o} for ${n}`),
        i.receivedChunks === o)
      ) {
        (clearTimeout(i.timer), this.chunkBuffer.delete(n));
        try {
          let g = i.chunks.join("");
          return (
            this.logger.debug(`[ChunkReceiver] Message ${n} assembled successfully`),
            { type: "normal", data: g }
          );
        } catch (g) {
          return (this.logger.error(`[ChunkReceiver] Failed to parse message ${n}`, g), null);
        }
      }
      return null;
    }
    clear() {
      (this.chunkBuffer.forEach((e) => clearTimeout(e.timer)), this.chunkBuffer.clear());
    }
  };
var p = class {
  constructor() {
    this.listeners = new Map();
  }
  on(e, s) {
    (this.listeners.has(e) || this.listeners.set(e, []), this.listeners.get(e).push(s));
  }
  emit(e, s) {
    let r = this.listeners.get(e);
    r && [...r].forEach((t) => t(s));
  }
  off(e, s) {
    if (!s) {
      this.listeners.delete(e);
      return;
    }
    let r = this.listeners.get(e);
    r &&
      this.listeners.set(
        e,
        r.filter((t) => t !== s),
      );
  }
};
var a = class {
  constructor(e) {
    ((this.enabled = e?.enabled ?? !1),
      (this.prefix = e?.prefix ?? "SystemMessage"),
      this.enabled ||
        ((this.debug = this.info = this.warn = this.group = () => {}),
        (this.error = (...s) => console.error(...s))));
  }
  format(e, ...s) {
    let r = new Date().toISOString();
    return [`[${this.prefix}] [${e}] ${r}:`, ...s];
  }
  debug(...e) {
    console.debug(...this.format("debug", ...e));
  }
  info(...e) {
    console.info(...this.format("info", ...e));
  }
  warn(...e) {
    console.warn(...this.format("warn", ...e));
  }
  error(...e) {
    console.error(...this.format("error", ...e));
  }
  group(e, s) {
    console.group(`[${this.prefix}] ${e}`);
    try {
      s();
    } finally {
      console.groupEnd();
    }
  }
};
var l = class l {
  constructor(e = "system-message", s = !1) {
    this.channel = e;
    ((this.logger = new a({ enabled: s, prefix: "EventBusTransport" })),
      (this.chunkReceiver = new h(this.logger)));
  }
  send(e) {
    let s = JSON.stringify(e);
    l.bus.emit(this.channel, s);
  }
  onMessage(e) {
    l.bus.on(this.channel, (s) => {
      try {
        this.logger.debug("\u{1F4E5} Received message: ", s);
        let r = JSON.parse(s),
          t = this.chunkReceiver.receiveChunk(r);
        t &&
          (this.logger.debug("\u{1F4E5} Received and assembled message", t.data),
          e(JSON.parse(t.data)));
      } catch (r) {
        this.logger.error("\u274C Error parsing event bus message", r);
      }
    });
  }
};
l.bus = new p();
var m = l;
var c = class {
  constructor(e, s) {
    this.logger = e;
    this.maxChunkSize = s.maxChunkSize;
  }
  splitIfNeeded(e) {
    let s = JSON.stringify(e),
      r = new Blob([s]).size;
    if (r <= this.maxChunkSize)
      return (
        this.logger?.debug(`[ChunkSender] Normal message, size=${r} bytes`),
        { type: "normal", data: JSON.stringify(e) }
      );
    this.logger?.debug(`[ChunkSender] Large message detected, size=${r} bytes, splitting...`);
    let t = this.splitString(s, this.maxChunkSize),
      o = t.length,
      n = t.map((i, g) => ({
        type: "large",
        messageId: e.messageId,
        command: e.command,
        index: g,
        totalChunks: o,
        chunk: i,
      }));
    return (
      this.logger?.debug(`[ChunkSender] Created ${o} chunks for messageId=${e.messageId}`),
      n
    );
  }
  splitString(e, s) {
    let r = [];
    for (let t = 0; t < e.length; t += s) r.push(e.slice(t, t + s));
    return r;
  }
};
var k = { isDebug: !1, timeout: 15e3, maxChunkSize: 64 * 1024 },
  d = class {
    constructor(e, s) {
      ((this.transport = e),
        (this.options = { ...k, ...s }),
        (this.logger = new a({ enabled: this.options.isDebug, prefix: "SystemMessage" })),
        (this.chunkSender = new c(this.logger, { maxChunkSize: this.options.maxChunkSize })),
        this.logger.debug("SystemMessage initialized", this.options));
    }
    send(e) {
      let s = this.chunkSender.splitIfNeeded(e);
      if (Array.isArray(s)) {
        this.logger.debug(
          `\u2702\uFE0F Message ${e.messageId} qu\xE1 l\u1EDBn \u2014 chia th\xE0nh ${s.length} chunk`,
        );
        for (let r of s) this.transport.send(r);
      } else
        (this.logger.debug(`\u{1F4E4} Sent normal message ${e.messageId}`), this.transport.send(s));
    }
    on(e) {
      this.transport.onMessage(e);
    }
    get config() {
      return this.options;
    }
  };
export { m as EventBusTransport, d as SystemMessage };
//# sourceMappingURL=index.mjs.map
