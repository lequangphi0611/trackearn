import pino from "pino";
import { getRequestContext } from "./request-context";

const isProd = process.env.NODE_ENV === "production";

// pino in-process (KHÔNG external service — xem docs/tech-stack.md).
// Dev: pino-pretty (màu, dễ đọc). Prod: JSON 1 dòng ra stdout → Docker thu.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  // Lưới an toàn: che field nhạy cảm nếu lỡ log nguyên object (xem
  // docs/rules/error-handling.md — input phải được sanitize trước khi log).
  redact: {
    paths: [
      "password",
      "token",
      "secret",
      "*.password",
      "*.token",
      "*.secret",
      "*.phone",
    ],
    censor: "[redacted]",
  },
  ...(isProd
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }),
});

// Sink lỗi (ERROR) — đăng ký từ instrumentation để ghi vào DB cho trang
// /admin. KHÔNG import `db` ở đây (tránh vòng lặp logger ← db/logger ← logger);
// instrumentation gọi registerErrorSink(persistError) lúc khởi động.
export type ErrorSinkEntry = {
  action: string;
  message: string;
  stack?: string;
  requestId?: string;
  userId?: string;
  extra?: Record<string, unknown>;
};
type ErrorSink = (entry: ErrorSinkEntry) => void;
let errorSink: ErrorSink | null = null;

/** Đăng ký nơi nhận lỗi ERROR (vd ghi DB). Gọi 1 lần ở instrumentation. */
export function registerErrorSink(sink: ErrorSink): void {
  errorSink = sink;
}

// Trộn context request hiện tại (requestId/action/userId) vào log nếu có.
function withContext(extra?: Record<string, unknown>): Record<string, unknown> {
  const ctx = getRequestContext();
  return {
    ...(ctx && {
      requestId: ctx.requestId,
      action: ctx.action,
      userId: ctx.userId,
    }),
    ...extra,
  };
}

/**
 * Log lỗi server kèm context. Thay cho console.error.
 * `extra.input` nên đã được sanitize (bỏ password/token/dữ liệu tài chính/PII).
 */
export function logError(
  action: string,
  err: unknown,
  extra?: Record<string, unknown>,
): void {
  logger.error(
    { ...withContext(extra), action, err },
    `[${action}] ${err instanceof Error ? err.message : "error"}`,
  );

  // Đẩy sang sink (DB) nếu đã đăng ký — sink tự nuốt lỗi của chính nó.
  if (errorSink) {
    const ctx = getRequestContext();
    errorSink({
      action,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      requestId: ctx?.requestId,
      userId: ctx?.userId,
      extra,
    });
  }
}

/**
 * Log lỗi ĐÃ XỬ LÝ / biết trước ở mức WARN — vd `APIError` (sai mật khẩu, email
 * trùng) hay business rejection trả qua ActionResult (NOT_FOUND/CONFLICT).
 * Vẫn log mọi lỗi, nhưng WARN tách khỏi ERROR (lỗi không mong đợi) để lọc.
 * `reason` có thể là Error (dùng serializer) hoặc string/object mô tả.
 */
export function logWarn(
  action: string,
  reason: unknown,
  extra?: Record<string, unknown>,
): void {
  const message = reason instanceof Error ? reason.message : String(reason);
  logger.warn(
    {
      ...withContext(extra),
      action,
      ...(reason instanceof Error ? { err: reason } : { reason }),
    },
    `[${action}] ${message}`,
  );
}
