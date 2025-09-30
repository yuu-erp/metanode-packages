// Định nghĩa type alias thay vì interface để phù hợp hơn với cấu trúc dữ liệu đơn giản
export interface NormalizedException {
  message: string
  code: string
  correlationId: string
  stack?: string
  cause?: string
  /**
   * ^ Consider adding optional `metadata` object to
   * exceptions (if language doesn't support anything
   * similar by default) and pass some useful technical
   * information about the exception when throwing.
   * This will make debugging easier.
   */
  metadata?: Record<string, unknown>
}
// Lớp trừu tượng ExceptionBase
export abstract class ExceptionBase extends Error {
  abstract code: string
  readonly correlationId: string
  readonly cause?: unknown
  /**
   * @param {string} message
   * @param {ObjectLiteral} [metadata={}]
   * **BE CAREFUL** not to include sensitive info in 'metadata'
   * to prevent leaks since all exception's data will end up
   * in application's log files. Only include non-sensitive
   * info that may help with debugging.
   */
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message)
    this.name = this.constructor.name // Gán tên lớp để dễ nhận diện
    Error.captureStackTrace(this, this.constructor)

    // Lấy correlationId từ context hoặc tạo mới nếu không có
    this.correlationId = ExceptionBase.getCorrelationId()
    this.metadata = metadata
  }

  // Thuộc tính metadata để lưu trữ thông tin bổ sung
  readonly metadata?: Record<string, unknown>

  // Phương thức tĩnh để lấy hoặc tạo correlationId
  private static getCorrelationId(): string {
    // Trong thực tế, lấy từ request context hoặc tạo UUID
    return 'request-id-' + Date.now() // Ví dụ đơn giản, thay bằng UUID trong thực tế
  }

  /**
   * Chuyển đổi ngoại lệ thành định dạng chuẩn hóa
   * @returns Đối tượng NormalizedException
   */
  toJSON(): NormalizedException {
    return {
      message: this.message,
      code: this.code,
      correlationId: this.correlationId,
      stack: this.stack,
      cause: this.cause ? JSON.stringify(this.cause) : undefined,
      metadata: this.metadata
    }
  }
}
