import { SystemMessage, EventBusTransport } from "@metanodejs/system-message";
import { ExceptionBase } from "@metanodejs/exceptions";

console.log("System core - measure send/receive 512MB payload");

try {
  const eventBusA = new EventBusTransport("test-bus", false);
  const eventBusB = new EventBusTransport("test-bus", false);

  const systemA = new SystemMessage(eventBusA, { isDebug: false });
  const systemB = new SystemMessage(eventBusB, { isDebug: false });

  let startSend = 0;

  systemB.on((msg) => {
    const end = performance.now();
    console.log("✅ [Node B] Received message:", msg);
    console.log(`⏱️  Receive latency: ${(end - startSend).toFixed(2)} ms`);
  });

  console.time("create_string");
  const bigString = "A".repeat(256 * 1024 * 1024); // ~512MB in memory
  console.timeEnd("create_string");

  startSend = performance.now();
  systemA.send({
    messageId: "uuid-123",
    command: "uploadLargePayload",
    value: { content: bigString },
    windowId: "123",
  });
  console.log("📤 Message sent at", new Date().toISOString());
} catch (error) {
  if (error instanceof ExceptionBase) {
    console.log(error.toJSON());
  } else {
    console.error(error);
  }
}
