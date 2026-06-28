import { db } from "./index";
import { errorLogs } from "./schema";
import type { ErrorSinkEntry } from "@/lib/logger";

/**
 * Sink ghi lỗi ERROR vào bảng error_logs cho trang /admin. Đăng ký qua
 * registerErrorSink ở instrumentation. TỰ NUỐT lỗi (không ném, không gọi
 * logError — tránh đệ quy khi chính DB lỗi); fallback console.error.
 * Fire-and-forget: không chặn luồng request.
 */
export function persistError(entry: ErrorSinkEntry): void {
  void db
    .insert(errorLogs)
    .values({
      level: "error",
      action: entry.action,
      message: entry.message,
      stack: entry.stack ?? null,
      requestId: entry.requestId ?? null,
      userId: entry.userId ?? null,
      extra: entry.extra ?? null,
    })
    .catch((err) => {
      console.error("[persistError] không ghi được error_logs", err);
    });
}
