// Định dạng hiển thị (tiền VND, ngày giờ theo giờ VN).

const vndFormatter = new Intl.NumberFormat("vi-VN");

/** Số tiền đồng → "1.000.000 ₫". */
export function formatCurrency(amount: number): string {
  return `${vndFormatter.format(amount)} ₫`;
}

/**
 * Số lượng tồn (numeric string/number) → bỏ số 0 thừa, kèm đơn vị nếu có.
 * Vd "12.500" → "12,5"; ("3.000","cái") → "3 cái". Dấu phẩy thập phân VN.
 */
export function formatQuantity(value: string | number, unit?: string): string {
  const n = typeof value === "string" ? Number(value) : value;
  const text = Number.isFinite(n)
    ? n.toLocaleString("vi-VN", { maximumFractionDigits: 3 })
    : String(value);
  return unit ? `${text} ${unit}` : text;
}

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Mốc thời gian (instant) → ngày giờ VN. */
export function formatDateTime(value: Date | string): string {
  return dateTimeFormatter.format(typeof value === "string" ? new Date(value) : value);
}

/** Ngày (Date hoặc "YYYY-MM-DD") → dd/MM/yyyy VN. */
export function formatDate(value: Date | string): string {
  return dateFormatter.format(typeof value === "string" ? new Date(value) : value);
}

const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  hour: "2-digit",
  minute: "2-digit",
});

/** Mốc thời gian → giờ:phút VN. */
export function formatTime(value: Date | string): string {
  return timeFormatter.format(typeof value === "string" ? new Date(value) : value);
}

/**
 * % thay đổi so kỳ trước → "+12%" / "−8%"; `null` khi kỳ trước = 0 (UI hiện "—").
 * Mẫu số |prev| để kỳ trước âm (lãi âm) không lật dấu chiều thay đổi.
 */
export function formatPercentChange(current: number, prev: number): string | null {
  if (prev === 0) return null;
  const pct = Math.round(((current - prev) / Math.abs(prev)) * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
}
