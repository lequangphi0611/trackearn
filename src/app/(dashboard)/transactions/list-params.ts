import type { TransactionFilters } from "@/queries/transactions";
import { vnDateOnly, vnLocalToInstant, vnMonthRange } from "@/lib/date";
import type { PaymentStatus, TransactionType } from "@/lib/payment";

// Dùng chung cho /transactions và /transactions/[line] — 2 view chỉ khác
// nhau ở businessLine, phần parse searchParams/build query phải giống hệt
// nhau để số liệu 2 view không lệch (xem tmp/reports-drilldown-implement.md).
export type TransactionListSearchParams = {
  from?: string;
  to?: string;
  type?: string;
  status?: string;
  q?: string;
  page?: string;
  // Chỉ đến từ link drill-down báo cáo (reports.md §4.5) — xem TransactionFilters.
  categoryId?: string;
  excludeCategoryId?: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseTransactionListParams(
  sp: TransactionListSearchParams,
  businessLine: string | null | undefined,
) {
  const range = vnMonthRange();
  const fromStr = sp.from || vnDateOnly(range.from);
  const toStr = sp.to || vnDateOnly(new Date(range.to.getTime() - 1));
  const fromInstant = vnLocalToInstant(`${fromStr}T00:00`);
  const toInstant = new Date(vnLocalToInstant(`${toStr}T00:00`).getTime() + DAY_MS);
  const page = Math.max(0, Math.trunc(Number(sp.page) || 0));

  const type =
    sp.type === "income" || sp.type === "expense" ? (sp.type as TransactionType) : undefined;
  const status =
    sp.status === "paid" || sp.status === "partial" || sp.status === "pending"
      ? (sp.status as PaymentStatus)
      : undefined;

  const query: TransactionFilters = {
    businessLine,
    from: fromInstant,
    to: toInstant,
    type,
    status,
    q: sp.q?.trim() || undefined,
    categoryId: sp.categoryId || undefined,
    excludeCategoryId: sp.excludeCategoryId || undefined,
    page,
  };

  const moreParams = new URLSearchParams();
  if (sp.q) moreParams.set("q", sp.q);
  if (sp.type) moreParams.set("type", sp.type);
  if (sp.status) moreParams.set("status", sp.status);
  if (sp.categoryId) moreParams.set("categoryId", sp.categoryId);
  if (sp.excludeCategoryId) moreParams.set("excludeCategoryId", sp.excludeCategoryId);
  moreParams.set("from", fromStr);
  moreParams.set("to", toStr);
  moreParams.set("page", String(page + 1));

  // key của Suspense KHÔNG đổi theo page → tải thêm không nhấp nháy skeleton;
  // chỉ đổi theo bộ lọc để hiện skeleton khi đổi điều kiện.
  const filterKey = `${fromStr}|${toStr}|${type ?? ""}|${status ?? ""}|${sp.q ?? ""}|${sp.categoryId ?? ""}|${sp.excludeCategoryId ?? ""}`;

  return { query, moreParams, filterKey, fromStr, toStr };
}
