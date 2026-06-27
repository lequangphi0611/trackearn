import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getRecentErrors } from "@/queries/error-logs";
import { getMigrationStatus } from "@/lib/migration-status";
import { formatDateTime } from "@/lib/format";

// Trang chẩn đoán DEV: sức khỏe app/DB, phiên bản đang chạy, migration, lỗi
// runtime gần đây. Luôn ping thật, không cache.
export const dynamic = "force-dynamic";

async function pingDb(): Promise<boolean> {
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}

// Migration mới nhất đã áp (đọc bảng nội bộ drizzle.__drizzle_migrations).
async function lastMigration(): Promise<{ hash: string; at: Date } | null> {
  try {
    const rows = await db.execute<{ hash: string; created_at: string }>(
      sql`select hash, created_at from drizzle.__drizzle_migrations order by created_at desc limit 1`,
    );
    const row = (rows as unknown as { hash: string; created_at: string }[])[0];
    if (!row) return null;
    return { hash: row.hash, at: new Date(Number(row.created_at)) };
  } catch {
    return null;
  }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-mono">{children}</span>
    </div>
  );
}

export default async function AdminPage() {
  const [dbUp, migration, errors] = await Promise.all([
    pingDb(),
    lastMigration(),
    getRecentErrors(100).catch(() => []),
  ]);
  const migrateStatus = getMigrationStatus();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold">Chẩn đoán hệ thống</h1>
        <p className="text-sm text-muted-foreground">
          Trang dành cho dev. Cập nhật lúc {formatDateTime(new Date())}.
        </p>
      </header>

      <section className="rounded-lg border p-4">
        <h2 className="mb-2 font-medium">Sức khỏe &amp; phiên bản</h2>
        <Row label="Ứng dụng">đang chạy</Row>
        <Row label="Database">
          <span className={dbUp ? "text-[var(--income)]" : "text-[var(--expense)]"}>
            {dbUp ? "up" : "down"}
          </span>
        </Row>
        <Row label="Commit (GIT_SHA)">{process.env.GIT_SHA ?? "unknown"}</Row>
        <Row label="Build time">{process.env.BUILD_TIME ?? "unknown"}</Row>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="mb-2 font-medium">Migration</h2>
        <Row label="Auto-migrate (lúc khởi động)">
          <span
            className={
              migrateStatus.state === "ok"
                ? "text-[var(--income)]"
                : migrateStatus.state === "error"
                  ? "text-[var(--expense)]"
                  : ""
            }
          >
            {migrateStatus.state}
          </span>
        </Row>
        {migrateStatus.ranAt && (
          <Row label="Chạy lúc">{formatDateTime(migrateStatus.ranAt)}</Row>
        )}
        {migrateStatus.error && <Row label="Lỗi migrate">{migrateStatus.error}</Row>}
        <Row label="Migration mới nhất (DB)">
          {migration ? `${migration.hash.slice(0, 12)} · ${formatDateTime(migration.at)}` : "—"}
        </Row>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="mb-3 font-medium">Lỗi gần đây ({errors.length})</h2>
        {errors.length === 0 ? (
          <p className="text-sm text-muted-foreground">Không có lỗi nào được ghi.</p>
        ) : (
          <ul className="space-y-3">
            {errors.map((e) => (
              <li key={e.id} className="rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-mono font-medium text-[var(--expense)]">
                    [{e.action}] {e.message}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(e.createdAt)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {e.requestId && <span>req: {e.requestId} </span>}
                  {e.userId && <span>· user: {e.userId}</span>}
                </div>
                {e.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-muted-foreground">
                      Stack trace
                    </summary>
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
                      {e.stack}
                    </pre>
                  </details>
                )}
                {e.extra != null && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs text-muted-foreground">
                      Chi tiết
                    </summary>
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
                      {JSON.stringify(e.extra, null, 2)}
                    </pre>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
