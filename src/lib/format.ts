// Định dạng hiển thị (tiền VND, ngày giờ theo giờ VN).

const vndFormatter = new Intl.NumberFormat("vi-VN");

/** Số tiền đồng → "1.000.000 ₫". */
export function formatCurrency(amount: number): string {
  return `${vndFormatter.format(amount)} ₫`;
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
