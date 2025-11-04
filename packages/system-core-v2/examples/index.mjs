var u = class h extends Error {
  constructor(s, t) {
    (super(s),
      (this.name = this.constructor.name),
      (this.correlationId = h.getCorrelationId()),
      (this.metadata = t));
  }
  static getCorrelationId() {
    return "request-id-" + Date.now();
  }
  toJSON() {
    let s = { message: this.message, code: this.code, correlationId: this.correlationId };
    return (
      this.stack && (s.stack = this.stack),
      this.cause && (s.cause = JSON.stringify(this.cause)),
      this.metadata && (s.metadata = this.metadata),
      s
    );
  }
};
var p = { timeout: 15e3 },
  f = class {
    constructor(e, s) {
      ((this.chunkBuffer = new Map()), (this.logger = e), (this.options = { ...p, ...s }));
    }
    receiveChunk(e) {
      if (!e.type || e.type !== "large") return e;
      let { command: s, chunk: t, index: r, totalChunks: n } = e,
        i = `${s}`,
        a = this.chunkBuffer.get(i);
      if (
        (a ||
          ((a = {
            totalChunks: n,
            receivedChunks: 0,
            chunks: new Array(n),
            timer: setTimeout(() => {
              (this.logger.warn(`Timeout assembling message ${i}`), this.chunkBuffer.delete(i));
            }, this.options.timeout),
          }),
          this.chunkBuffer.set(i, a)),
        (a.chunks[r] = t),
        a.receivedChunks++,
        this.logger.debug(`[ChunkReceiver] Received chunk ${r + 1}/${n} for ${i}`),
        a.receivedChunks === n)
      ) {
        (clearTimeout(a.timer), this.chunkBuffer.delete(i));
        try {
          let o = a.chunks.join("");
          return (
            this.logger.debug(`[ChunkReceiver] Message ${i} assembled successfully`),
            { type: "normal", data: o }
          );
        } catch (o) {
          return (this.logger.error(`[ChunkReceiver] Failed to parse message ${i}`, o), null);
        }
      }
      return null;
    }
    clear() {
      (this.chunkBuffer.forEach((e) => clearTimeout(e.timer)), this.chunkBuffer.clear());
    }
  },
  d = class {
    constructor(e) {
      ((this.enabled = e?.enabled ?? !1),
        (this.prefix = e?.prefix ?? "SystemMessage"),
        this.enabled ||
          ((this.debug = this.info = this.warn = this.group = () => {}),
          (this.error = (...s) => console.error(...s))));
    }
    format(e, ...s) {
      let t = new Date().toISOString();
      return [`[${this.prefix}] [${e}] ${t}:`, ...s];
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
var E = class {
    constructor() {
      this.listeners = new Map();
    }
    on(e, s) {
      (this.listeners.has(e) || this.listeners.set(e, []), this.listeners.get(e).push(s));
    }
    emit(e, s) {
      let t = this.listeners.get(e);
      t && [...t].forEach((r) => r(s));
    }
    off(e, s) {
      if (!s) {
        this.listeners.delete(e);
        return;
      }
      let t = this.listeners.get(e);
      t &&
        this.listeners.set(
          e,
          t.filter((r) => r !== s),
        );
    }
  },
  m = class c {
    constructor(s = "system-message", t = !1) {
      ((this.channel = s),
        (this.logger = new d({ enabled: t, prefix: "EventBusTransport" })),
        (this.chunkReceiver = new f(this.logger)));
    }
    send(s) {
      let t = JSON.stringify(s);
      c.bus.emit(this.channel, t);
    }
    onMessage(s) {
      c.bus.on(this.channel, (t) => {
        try {
          this.logger.debug("\u{1F4E5} Received message: ", t);
          let r = JSON.parse(t),
            n = this.chunkReceiver.receiveChunk(r);
          n &&
            (this.logger.debug("\u{1F4E5} Received and assembled message", n.data),
            s(JSON.parse(n.data)));
        } catch (r) {
          this.logger.error("\u274C Error parsing event bus message", r);
        }
      });
    }
  };
m.bus = new E();
var g = m;
var w = class {
    constructor(e, s) {
      ((this.logger = e), (this.maxChunkSize = s.maxChunkSize));
    }
    splitIfNeeded(e) {
      let s = JSON.stringify(e),
        t = new Blob([s]).size;
      if (t <= this.maxChunkSize)
        return (
          this.logger?.debug(`[ChunkSender] Normal message, size=${t} bytes`),
          { type: "normal", data: JSON.stringify(e) }
        );
      this.logger?.debug(`[ChunkSender] Large message detected, size=${t} bytes, splitting...`);
      let r = this.splitString(s, this.maxChunkSize),
        n = r.length,
        i = r.map((a, o) => ({
          type: "large",
          messageId: e.messageId,
          command: e.command,
          index: o,
          totalChunks: n,
          chunk: a,
        }));
      return (
        this.logger?.debug(`[ChunkSender] Created ${n} chunks for messageId=${e.messageId}`),
        i
      );
    }
    splitString(e, s) {
      let t = [];
      for (let r = 0; r < e.length; r += s) t.push(e.slice(r, r + s));
      return t;
    }
  },
  v = { isDebug: !1, timeout: 15e3, maxChunkSize: 64 * 1024 },
  l = class {
    constructor(e, s) {
      ((this.transport = e),
        (this.options = { ...v, ...s }),
        (this.logger = new d({ enabled: this.options.isDebug, prefix: "SystemMessage" })),
        (this.chunkSender = new w(this.logger, { maxChunkSize: this.options.maxChunkSize })),
        this.logger.debug("SystemMessage initialized", this.options));
    }
    send(e) {
      let s = this.chunkSender.splitIfNeeded(e);
      if (Array.isArray(s)) {
        this.logger.debug(
          `\u2702\uFE0F Message ${e.messageId} qu\xE1 l\u1EDBn \u2014 chia th\xE0nh ${s.length} chunk`,
        );
        for (let t of s) this.transport.send(t);
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
console.log("System core - measure send/receive 512MB payload");
try {
  let e = new g("test-bus", !1),
    s = new g("test-bus", !1),
    t = new l(e, { isDebug: !1 }),
    r = new l(s, { isDebug: !1 }),
    n = 0;
  (r.on((a) => {
    let o = performance.now();
    (console.log("\u2705 [Node B] Received message:", a),
      console.log(`\u23F1\uFE0F  Receive latency: ${(o - n).toFixed(2)} ms`));
  }),
    console.time("create_string"));
  let i = "A".repeat(256 * 1024 * 1024);
  (console.timeEnd("create_string"),
    (n = performance.now()),
    t.send({
      messageId: "uuid-123",
      command: "uploadLargePayload",
      value: { content: i },
      windowId: "123",
    }),
    console.log("\u{1F4E4} Message sent at", new Date().toISOString()));
} catch (e) {
  e instanceof u ? console.log(e.toJSON()) : console.error(e);
}
//# sourceMappingURL=index.mjs.map
