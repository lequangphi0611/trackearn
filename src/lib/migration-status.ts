// Trạng thái auto-migrate lúc container khởi động (xem src/instrumentation.ts).
// Lưu ở module riêng để trang /admin đọc mà không kéo theo phụ thuộc nặng.
//
// LƯU Ý: prod standalone (`node server.js`, 1 process) → register() và render
// chung process nên biến này đọc đúng "ok"/"error". Còn `next dev` chạy
// instrumentation ở worker riêng → trang đọc "pending" dù migrate đã chạy;
// đây là hạn chế của dev. Nguồn chân lý chéo-process là bảng
// __drizzle_migrations (trang /admin hiển thị riêng "Migration mới nhất").
export type MigrationStatus = {
  state: "pending" | "ok" | "error";
  ranAt?: Date;
  error?: string;
};

const status: MigrationStatus = { state: "pending" };

export function setMigrationStatus(next: MigrationStatus): void {
  Object.assign(status, next);
}

export function getMigrationStatus(): MigrationStatus {
  return status;
}
