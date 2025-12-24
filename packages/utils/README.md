# @metanodejs/system-message 📩

`@metanodejs/system-message` là package JS/ESM dùng để **gửi/nhận message chuẩn hóa** giữa các môi trường khác nhau. Hỗ trợ message lớn, debug chi tiết, và transport linh hoạt.

---

## ⚡ Features

- Giao tiếp **đồng nhất** giữa các nodes, webviews, iframe, native apps.
- Hỗ trợ **message payload lớn** với chunking tự động.
- Các transport sẵn có:
  - `EventBusTransport` – node internal / Web → Web
  - `PostMessageTransport` – Web ↔ iframe, WebView
  - `NativeBridgeTransport` – WebView ↔ Native (iOS/Android)
- Cho phép **custom transport** riêng, đồng bộ message format.
- Debug mode dễ dàng theo dõi messageId, chunks, và status gửi/nhận.

---

## 📦 Cài đặt

```bash
npm install @metanodejs/system-message
```

---

## 🧩 Các thành phần chính

### SystemMessage

Wrapper xử lý message chuẩn và chunking.

```ts
new SystemMessage(transport: BaseTransport, options?: SystemMessageOptions)
```

- `transport`: instance transport (EventBus, PostMessage, NativeBridge hoặc custom).
- `options`:
  - `isDebug` (boolean) – bật log debug
  - `timeout` (ms) – timeout request
  - `maxChunkSize` (bytes) – giới hạn chunk size

**Methods**

- `send(message: MessagePayload)` – gửi message
- `on(callback: (msg: MessagePayload) => void)` – nhận message

**MessagePayload**

```ts
{
  messageId: string;
  command: string;
  value?: any;
}
```

---

### Transports có sẵn

#### EventBusTransport

Node internal / Web ↔ Web, dựa trên EventEmitter.

```ts
new EventBusTransport(busName: string, debug?: boolean)
```

#### PostMessageTransport

Web ↔ iframe / WebView. Dùng `window.postMessage` hoặc `iframe.contentWindow.postMessage`.

```ts
new PostMessageTransport(targetWindow: Window, origin?: string, debug?: boolean)
```

#### NativeBridgeTransport

WebView ↔ Native App. Dùng `window.webkit.messageHandlers` (iOS) hoặc `window.AndroidBridge` (Android).

```ts
new NativeBridgeTransport(bridgeName: string, debug?: boolean)
```

#### CustomTransport

Em có thể extend `BaseTransport` để tạo transport riêng.

```ts
class MyTransport extends BaseTransport {
  sendMessage(message: MessagePayload) { ... }
  onMessage(callback: (msg) => void) { ... }
}
```

---

## 🚀 Example

```js
import { SystemMessage, EventBusTransport } from "@metanodejs/system-message";

// Node A
const busA = new EventBusTransport("my-bus", true);
const systemA = new SystemMessage(busA, { isDebug: true });

// Node B
const busB = new EventBusTransport("my-bus", true);
const systemB = new SystemMessage(busB, { isDebug: true });
systemB.on((msg) => console.log("Node B received:", msg));

// Gửi message lớn 500KB
const bigString = "A".repeat(1024 * 500);
systemA.send({ messageId: "uuid-001", command: "bigData", value: { content: bigString } });
```

---

## 📝 Notes

- Tất cả transport đều **đồng bộ theo message format**.
- Payload lớn được tự động chia chunk, reassemble.
- Debug mode giúp log chi tiết chunk, messageId, trạng thái gửi/nhận.
- Dễ mở rộng custom transport cho các môi trường khác nhau.

---

## 💡 TODO / Future

- Thêm **acknowledge / response pattern** cho từng command.
- Hỗ trợ **queue message offline** (khi transport chưa sẵn sàng).
- Hỗ trợ **broadcast / multicast** giữa nhiều clients.
