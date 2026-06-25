// Quy tắc nghiệp vụ thuần cho giao dịch & công nợ — xem
// docs/spec/transactions-and-debts.md §3.

export type TransactionType = "income" | "expense";
export type PaymentStatus = "paid" | "partial" | "pending";
export type DebtDirection = "receivable" | "payable";

/** Suy `payment_status` từ số đã trả & tổng (§3.1) — không bao giờ nhập tay. */
export function derivePaymentStatus(paidAmount: number, amount: number): PaymentStatus {
  if (paidAmount <= 0) return "pending";
  if (paidAmount >= amount) return "paid";
  return "partial";
}

/** income trả sau → khách nợ mình (receivable); expense → mình nợ NCC (payable). */
export function deriveDirection(type: TransactionType): DebtDirection {
  return type === "income" ? "receivable" : "payable";
}
