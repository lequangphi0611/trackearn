// Next.js instrumentation — chạy 1 lần khi server khởi động (register) và
// nhận mọi lỗi render/route chưa bắt (onRequestError). Xem
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation

import type { Instrumentation } from "next";

export async function register(): Promise<void> {
  // Chỉ chạy ở runtime Node (bỏ qua edge/middleware bundle).
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Import động: tránh kéo pg/pino vào edge bundle.
  const { registerErrorSink } = await import("@/lib/logger");
  const { persistError } = await import("@/db/error-log");
  const { setMigrationStatus } = await import("@/lib/migration-status");

  // 1) Gắn sink: mọi logError(...) cũng ghi vào bảng error_logs cho /admin.
  registerErrorSink(persistError);

  // 2) Auto-migrate khi container lên — connection riêng (max:1), bọc try/catch
  //    để KHÔNG crash app nếu migrate lỗi (trang /admin còn xem được trạng thái).
  const url = process.env.DATABASE_URL;
  if (!url) {
    setMigrationStatus({ state: "error", error: "DATABASE_URL chưa cấu hình" });
    return;
  }
  const postgres = (await import("postgres")).default;
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const sql = postgres(url, { max: 1 });
  try {
    await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
    setMigrationStatus({ state: "ok", ranAt: new Date() });
  } catch (err) {
    const { logError } = await import("@/lib/logger");
    setMigrationStatus({
      state: "error",
      ranAt: new Date(),
      error: err instanceof Error ? err.message : String(err),
    });
    logError("auto-migrate", err);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  const { logError } = await import("@/lib/logger");
  logError(context.routerKind ?? "request", err, {
    route: request.path,
    method: request.method,
    digest: err instanceof Error ? (err as { digest?: string }).digest : undefined,
    routeType: context.routeType,
  });
};
