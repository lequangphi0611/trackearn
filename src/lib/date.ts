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

/** "YYYY-MM-DD" hợp lệ (đúng format và là ngày có thật). */
export function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Khoảng [00:00, 00:00 hôm sau) giờ VN của ngày `dateISO`, trả về instant UTC. */
export function vnDayRange(dateISO: string): { from: Date; to: Date } {
  const from = new Date(new Date(`${dateISO}T00:00:00Z`).getTime() - VN_OFFSET_MS);
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  return { from, to };
}

/** Cộng/trừ ngày trên chuỗi "YYYY-MM-DD" (thuần lịch, không tz). */
export function vnAddDays(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export type ReportPeriod = "month" | "quarter" | "year";

// Mốc đầu kỳ (năm/tháng-UTC-wall) chứa dateISO theo loại kỳ.
function periodStart(period: ReportPeriod, dateISO: string): { y: number; m: number } {
  const d = new Date(`${dateISO}T00:00:00Z`);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  if (period === "month") return { y, m };
  if (period === "quarter") return { y, m: Math.floor(m / 3) * 3 };
  return { y, m: 0 };
}

const PERIOD_MONTHS: Record<ReportPeriod, number> = { month: 1, quarter: 3, year: 12 };

/**
 * Khoảng [from, to) của kỳ chứa `dateISO` + kỳ liền trước cùng loại,
 * ranh giới theo giờ VN, trả về instant UTC.
 */
export function vnPeriodRange(
  period: ReportPeriod,
  dateISO: string,
): { from: Date; to: Date; prevFrom: Date; prevTo: Date } {
  const { y, m } = periodStart(period, dateISO);
  const len = PERIOD_MONTHS[period];
  const from = new Date(Date.UTC(y, m, 1) - VN_OFFSET_MS);
  const to = new Date(Date.UTC(y, m + len, 1) - VN_OFFSET_MS);
  const prevFrom = new Date(Date.UTC(y, m - len, 1) - VN_OFFSET_MS);
  return { from, to, prevFrom, prevTo: from };
}

/** Dời `dateISO` sang kỳ liền trước/sau cùng loại (trả về ngày 1 của kỳ đích). */
export function vnPeriodShift(period: ReportPeriod, dateISO: string, delta: 1 | -1): string {
  const { y, m } = periodStart(period, dateISO);
  const target = new Date(Date.UTC(y, m + PERIOD_MONTHS[period] * delta, 1));
  return target.toISOString().slice(0, 10);
}

/**
 * N tháng gần nhất (tính cả tháng hiện tại VN): khoảng [from, to) instant UTC
 * + danh sách khóa "YYYY-MM" theo thứ tự cũ → mới để zero-fill.
 */
export function vnLastNMonths(
  n: number,
  ref: Date = new Date(),
): { from: Date; to: Date; months: string[] } {
  const vnWall = new Date(ref.getTime() + VN_OFFSET_MS);
  const y = vnWall.getUTCFullYear();
  const m = vnWall.getUTCMonth();
  const from = new Date(Date.UTC(y, m - (n - 1), 1) - VN_OFFSET_MS);
  const to = new Date(Date.UTC(y, m + 1, 1) - VN_OFFSET_MS);
  const months: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    months.push(new Date(Date.UTC(y, m - i, 1)).toISOString().slice(0, 7));
  }
  return { from, to, months };
}
