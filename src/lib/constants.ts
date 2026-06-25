// Mảng kinh doanh — tập cố định, lưu dưới dạng cột text `business_line`
// (không tạo bảng riêng). NULL = chi phí chung không gắn mảng nào.
export const BUSINESS_LINES = ["xe_muc", "thiet_bi", "phu_kien"] as const;
export type BusinessLine = (typeof BUSINESS_LINES)[number];

// Nhãn hiển thị tiếng Việt cho từng mảng.
export const BUSINESS_LINE_LABELS: Record<BusinessLine, string> = {
  xe_muc: "Xe múc",
  thiet_bi: "Thiết bị điện tử",
  phu_kien: "Phụ kiện",
};

// Màu accent badge theo mảng (xem docs/rules/ui-design.md) — dùng để quét bảng nhanh.
export const BUSINESS_LINE_STYLES: Record<BusinessLine, string> = {
  xe_muc: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  thiet_bi: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  phu_kien: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};
