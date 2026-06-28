import { BUSINESS_LINE_LABELS, type BusinessLine } from "./constants";

// Cấu hình 4 màn giao dịch theo URL slug (route động /transactions/[line]).
// `chi-phi-chung` không phải mảng kinh doanh → business_line = null, chỉ expense.
export type TransactionLine = {
  slug: string;
  businessLine: BusinessLine | null;
  label: string;
  expenseOnly: boolean;
};

export const TRANSACTION_LINES: TransactionLine[] = [
  { slug: "xe-muc", businessLine: "xe_muc", label: BUSINESS_LINE_LABELS.xe_muc, expenseOnly: false },
  {
    slug: "thiet-bi",
    businessLine: "thiet_bi",
    label: BUSINESS_LINE_LABELS.thiet_bi,
    expenseOnly: false,
  },
  {
    slug: "phu-kien",
    businessLine: "phu_kien",
    label: BUSINESS_LINE_LABELS.phu_kien,
    expenseOnly: false,
  },
  { slug: "chi-phi-chung", businessLine: null, label: "Chi phí chung", expenseOnly: true },
];

export function getTransactionLine(slug: string): TransactionLine | undefined {
  return TRANSACTION_LINES.find((line) => line.slug === slug);
}

export function getLineByBusinessLine(
  businessLine: string | null,
): TransactionLine | undefined {
  return TRANSACTION_LINES.find((line) => line.businessLine === businessLine);
}
