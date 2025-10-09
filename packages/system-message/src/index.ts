console.log("🚀 RUN LARGE MESSAGE TEST");

import { SystemMessage } from "./core/system-message";
import { EventBusTransport } from "./transport";

// const eventBusTransport = new EventBusTransport("system-message", true);
// const systemMessage = new SystemMessage(eventBusTransport, { isDebug: true });
const eventBusA = new EventBusTransport("test-bus", true);
const eventBusB = new EventBusTransport("test-bus", true);
// Node A
const systemA = new SystemMessage(eventBusA, { isDebug: true });
// Node B
const systemB = new SystemMessage(eventBusB, { isDebug: true });

// Node B listen
systemB.on((msg) => {
  console.log("✅ [Node B] Received message:", msg);
});

// Tạo message cực lớn
// const bigString = "A".repeat(1024 * 200); // 200KB
systemA.send({
  messageId: "uuid-123",
  command: "getUserById",
  value: { content: 1 },
});
