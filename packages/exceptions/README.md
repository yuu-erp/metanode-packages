# @metanodejs/exceptions

Một package xử lý ngoại lệ đơn giản, nhất quán và an toàn với TypeScript/Node.js. Package cung cấp lớp cơ sở `ExceptionBase` và một số loại ngoại lệ phổ biến, hỗ trợ **correlation ID, metadata, và định dạng JSON chuẩn** giúp dễ dàng log và debug.

## Tính năng

- Lớp cơ sở trừu tượng `ExceptionBase` với:
  - Tự động tạo `correlationId`
  - Hỗ trợ `metadata` tùy chọn để debug
  - Phương thức `toJSON()` để chuẩn hóa ngoại lệ

- Các ngoại lệ có sẵn:
  - `ArgumentNotProvidedException`
  - `ArgumentInvalidException`
  - `ArgumentOutOfRangeException`
  - `ConflictException`
  - `NotFoundException`
  - `InternalServerErrorException`

- Các mã lỗi chuẩn để dễ dàng xử lý nhất quán giữa các service.

## Cài đặt

```bash
npm install @metanodejs/exceptions
# hoặc sử dụng yarn
yarn add @metanodejs/exceptions
```

## Sử dụng

```ts
import { ArgumentInvalidException, InternalServerErrorException } from "@metanodejs/exceptions";

function example(value: number) {
  if (value < 0) {
    throw new ArgumentInvalidException("Giá trị phải >= 0", { value });
  }

  try {
    // Thao tác có thể gây lỗi
  } catch (err) {
    throw new InternalServerErrorException("Lỗi không mong muốn", { cause: err });
  }
}

// Xử lý ngoại lệ
try {
  example(-5);
} catch (err) {
  if (err instanceof ArgumentInvalidException) {
    console.log(err.toJSON());
    /*
    {
      message: "Giá trị phải >= 0",
      code: "GENERIC.ARGUMENT_INVALID",
      correlationId: "request-id-1696943373600",
      metadata: { value: -5 },
      stack: "...stack trace..."
    }
    */
  }
}
```

## Lớp Exception Base

`ExceptionBase` là lớp trừu tượng để bạn kế thừa và tạo ngoại lệ tùy chỉnh.

```ts
import { ExceptionBase } from "@metanodejs/exceptions";

class CustomException extends ExceptionBase {
  readonly code = "CUSTOM_ERROR";
}

throw new CustomException("Đã xảy ra lỗi", { detail: "Thông tin bổ sung" });
```

### Thuộc tính

- `message`: string – thông báo lỗi
- `code`: string – mã lỗi duy nhất
- `correlationId`: string – ID dùng để theo dõi lỗi
- `metadata`: object tùy chọn – thông tin bổ sung
- `cause`: tùy chọn – lỗi gốc hoặc giá trị gây ra ngoại lệ

### Phương thức

- `toJSON(): NormalizedException` – trả về đối tượng JSON chuẩn để log hoặc truyền giữa các service.

## Mã lỗi có sẵn

| Ngoại lệ                       | Mã                              |
| ------------------------------ | ------------------------------- |
| `ArgumentNotProvidedException` | `GENERIC.ARGUMENT_NOT_PROVIDED` |
| `ArgumentInvalidException`     | `GENERIC.ARGUMENT_INVALID`      |
| `ArgumentOutOfRangeException`  | `GENERIC.ARGUMENT_OUT_OF_RANGE` |
| `ConflictException`            | `GENERIC.CONFLICT`              |
| `NotFoundException`            | `GENERIC.NOT_FOUND`             |
| `InternalServerErrorException` | `GENERIC.INTERNAL_SERVER_ERROR` |

## Contributing

1. Fork repository
2. Tạo branch cho tính năng mới: `git checkout -b my-feature`
3. Commit thay đổi: `git commit -m 'Thêm tính năng mới'`
4. Push branch: `git push origin my-feature`
5. Mở Pull Request
