// Tiện ích thời gian theo múi giờ Việt Nam (Asia/Ho_Chi_Minh = UTC+7, không DST).
// Cột timestamp lưu instant (timestamptz); việc bucket/so sánh theo NGÀY VN cần
// quy đổi qua giờ VN ở đây hoặc bằng `AT TIME ZONE 'Asia/Ho_Chi_Minh'` trong SQL.

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Khoảng [from, to) của tháng hiện tại theo giờ VN, trả về instant (UTC). */
export function vnMonthRange(ref: Date = new Date()): { from: Date; to: Date } {
  const vnWall = new Date(ref.getTime() + VN_OFFSET_MS);
  const y = vnWall.getUTCFullYear();
  const m = vnWall.getUTCMonth();
  // 00:00 ngày 1 (giờ VN) quy về instant UTC = wall - offset.
  const from = new Date(Date.UTC(y, m, 1) - VN_OFFSET_MS);
  const to = new Date(Date.UTC(y, m + 1, 1) - VN_OFFSET_MS);
  return { from, to };
}

/** Ngày hôm nay theo giờ VN dưới dạng "YYYY-MM-DD" (để so với cột date). */
export function vnTodayISODate(ref: Date = new Date()): string {
  return vnDateOnly(ref);
}

/** Instant → ngày VN "YYYY-MM-DD". */
export function vnDateOnly(instant: Date): string {
  return new Date(instant.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

/** "YYYY-MM-DDTHH:mm" (input datetime-local) theo giờ VN cho giá trị mặc định form. */
export function vnDateTimeLocal(ref: Date = new Date()): string {
  const vnWall = new Date(ref.getTime() + VN_OFFSET_MS);
  return vnWall.toISOString().slice(0, 16);
}

/** Chuỗi datetime-local (giờ VN, không tz) → instant UTC. */
export function vnLocalToInstant(local: string): Date {
  // local dạng "YYYY-MM-DDTHH:mm" hiểu là giờ VN → trừ offset ra UTC.
  return new Date(new Date(`${local}:00Z`).getTime() - VN_OFFSET_MS);
}

/** Quá hạn: có due_date, chưa tất toán, và due_date < hôm nay (VN). */
export function isOverdue(dueDate: string | null, settledAt: Date | string | null): boolean {
  if (!dueDate || settledAt) return false;
  return dueDate < vnTodayISODate();
}
