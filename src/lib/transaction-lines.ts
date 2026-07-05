import { BUSINESS_LINE_LABELS, type BusinessLine } from "./constants";

// Cấu hình 4 màn giao dịch theo URL slug (route động /transactions/[line]).
// `chi-phi-chung` không phải mảng kinh doanh → business_line = null, chỉ expense.
export type TransactionLine = {
  slug: string;
  businessLine: BusinessLine | null;
  label: string;
  expenseOnly: boolean;
  /** Có kho máy để "gắn với máy" khi ghi Thu — xem transactions/[line]/new. */
  hasDevicePicker: boolean;
};

export const TRANSACTION_LINES: TransactionLine[] = [
  {
    slug: "xe-muc",
    businessLine: "xe_muc",
    label: BUSINESS_LINE_LABELS.xe_muc,
    expenseOnly: false,
    hasDevicePicker: false,
  },
  {
    slug: "thiet-bi",
    businessLine: "thiet_bi",
    label: BUSINESS_LINE_LABELS.thiet_bi,
    expenseOnly: false,
    hasDevicePicker: true,
  },
  {
    slug: "phu-kien",
    businessLine: "phu_kien",
    label: BUSINESS_LINE_LABELS.phu_kien,
    expenseOnly: false,
    hasDevicePicker: false,
  },
  {
    slug: "chi-phi-chung",
    businessLine: null,
    label: "Chi phí chung",
    expenseOnly: true,
    hasDevicePicker: false,
  },
];

export function getTransactionLine(slug: string): TransactionLine | undefined {
  return TRANSACTION_LINES.find((line) => line.slug === slug);
}

export function getLineByBusinessLine(
  businessLine: string | null,
): TransactionLine | undefined {
  return TRANSACTION_LINES.find((line) => line.businessLine === businessLine);
}

// Hub duy nhất mỗi mảng (issue #12): thiết bị dùng /devices (kho) làm hub
// thay vì trang danh sách giao dịch riêng; các mảng khác vẫn là chính nó.
export function getLineHubHref(slug: string): string {
  return slug === "thiet-bi" ? "/devices" : `/transactions/${slug}`;
}

// Entry point cho menu "+" (tạo nhanh): xe múc và thiết bị dẫn vào hub để
// người dùng chọn muốn làm gì trước, các mảng còn lại tạo thẳng.
export function getQuickEntryHref(slug: string): string {
  if (slug === "xe-muc" || slug === "thiet-bi") return getLineHubHref(slug);
  return `/transactions/${slug}/new`;
}
