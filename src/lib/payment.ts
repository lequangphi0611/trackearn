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

export type DebtState = { total: number; paid: number; direction: DebtDirection };

export type DebtPaymentOutcome =
  | { ok: true; newPaid: number; tip: number; settled: boolean }
  | { ok: false; reason: "overpay" };

/**
 * Tính kết quả một lần ghi nhận trả (hàm thuần, dễ test) — xem
 * docs/spec/transactions-and-debts.md §3.3–3.4:
 * - payable (mình nợ NCC): KHÔNG trả dư → vượt số còn lại = lỗi `overpay`.
 * - receivable (khách nợ mình): trả dư → tất toán đúng `total`, phần vượt thành `tip`.
 * - `settled` khi đã trả đủ `total`.
 */
export function applyDebtPayment(debt: DebtState, amountPaid: number): DebtPaymentOutcome {
  const remaining = debt.total - debt.paid;

  if (debt.direction === "payable" && amountPaid > remaining) {
    return { ok: false, reason: "overpay" };
  }

  const tip = debt.direction === "receivable" && amountPaid > remaining ? amountPaid - remaining : 0;
  const newPaid = tip > 0 ? debt.total : debt.paid + amountPaid;
  return { ok: true, newPaid, tip, settled: newPaid >= debt.total };
}
