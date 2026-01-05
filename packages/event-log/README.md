# @metanodejs/event-log 📩

`@metanodejs/event-log` là package giúp **lắng nghe, decode và emit event logs từ blockchain**
theo kiến trúc clean và type-safe.

### Mục tiêu thiết kế

- Tách biệt rõ:
  - **Subscribe raw logs**
  - **Decode ABI**
  - **Business logic**
- API đơn giản, dễ dùng
- Không cần options object
- Dễ mở rộng, dễ test
- Phù hợp cho dApp, indexer, backend service

---

## Kiến trúc tổng thể

```
ABI JSON
   ↓
DecodeAbi.registerAbi()
   ↓
EventLog (subscribe raw logs)
   ↓
DecodeAbi.decodeAbi()
   ↓
emit { type, payload }
```

---

## Cài đặt

```bash
npm install @metanodejs/event-log
```

---

## Khởi tạo

### 1. Khởi tạo DecodeAbi và đăng ký ABI

```ts
import { DecodeAbi } from "./decode-abi/decode-abi";
import abi from "./abi/MyContract.json";

const decodeAbi = new DecodeAbi();
await decodeAbi.registerAbi(abi);
```

---

### 2. Khởi tạo EventLog

```ts
import { EventLog } from "./event-log/event-log";

const eventLog = new EventLog(decodeAbi);
```

---

## API

### registerEvent

Đăng ký lắng nghe event log theo address.

```ts
await eventLog.registerEvent(fromAddress, toAddresses);
```

**Params**

| Tên         | Kiểu     | Mô tả                           |
| ----------- | -------- | ------------------------------- |
| fromAddress | string   | Ví người gửi / user             |
| toAddresses | string[] | Danh sách address cần lắng nghe |

---

### onEventLog

Lắng nghe event đã decode.

```ts
const unsubscribe = eventLog.onEventLog((event) => {
  console.log(event.type, event.payload);
});
```

**Params**

| Tên      | Kiểu                   | Mô tả          |
| -------- | ---------------------- | -------------- |
| callback | (EventLogData) => void | Hàm nhận event |

**Return**

- Hàm `unsubscribe()` để huỷ lắng nghe.

---

### on (listen từng event)

Lắng nghe một event cụ thể theo event name.

```ts
const unsubscribe = eventLog.on("Transfer", (payload) => {
  console.log("Transfer payload:", payload);
});
```

**Params**

| Tên      | Kiểu              | Mô tả                    |
| -------- | ----------------- | ------------------------ |
| event    | string            | Tên event (ABI name)     |
| callback | (payload) => void | Hàm nhận payload decoded |

**Return**

- Hàm `unsubscribe()` để huỷ lắng nghe event đó.

## EventLogData

```ts
export interface EventLogData {
  type: string; // event name (ABI name)
  payload: unknown; // decoded data
}
```

---

## Ví dụ hoàn chỉnh

```ts
eventLog.onEventLog(({ type, payload }) => {
  if (type === "Transfer") {
    console.log("Transfer event:", payload);
  }
});
```

## Ví dụ hoàn chỉnh

```ts
eventLog.on("Transfer", (payload) => {
  console.log("Transfer event:", payload);
});
```

---

## Lọc event (Best Practice)

Nếu bạn chỉ muốn xử lý một số event nhất định, nên filter ở callback:

```ts
eventLog.onEventLog(({ type, payload }) => {
  if (type !== "Transfer") return;

  console.log("Transfer event:", payload);
});
```

Cách này giúp:

- API đơn giản
- Không cần options
- Dễ compose business logic

---

## Best Practices

- Register ABI một lần duy nhất
- Không decode ABI trong UI layer
- Dùng `on(eventName)` cho business logic
- `indexed string | bytes` không thể decode ngược (EVM limitation)
- EventLog chỉ nên làm infrastructure layer

---

## Mở rộng (Roadmap gợi ý)

Các hướng nâng cấp gợi ý:

- Typed events (`onEvent<'Transfer'>`)
- `once(eventName)`
- `waitFor(eventName, predicate)`
- Filter theo indexed param
- Batch / buffer event logs
- Auto-generate EventMap từ ABI

---

## License

MIT
