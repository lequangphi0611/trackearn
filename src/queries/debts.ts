import { and, desc, eq, ilike, isNotNull, isNull, lt, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { debts, transactions } from "@/db/schema";
import type { DebtDirection } from "@/lib/payment";
import { vnTodayISODate } from "@/lib/date";

export const DEBTS_PAGE_SIZE = 20;

export type DebtStatusFilter = "unsettled" | "settled" | "all";

export type DebtFilters = {
  direction: DebtDirection;
  status?: DebtStatusFilter; // mặc định unsettled
  overdueOnly?: boolean;
  q?: string;
  page?: number;
};

/** Tổng còn lại (total − paid) của các công nợ CHƯA tất toán theo chiều. */
export async function getDebtRemainingTotal(direction: DebtDirection): Promise<number> {
  const [row] = await db
    .select({
      remaining: sql<string>`coalesce(sum(${debts.total} - ${debts.paid}), 0)`,
    })
    .from(debts)
    .where(and(eq(debts.direction, direction), isNull(debts.settledAt)));
  return Number(row?.remaining ?? 0);
}

/** Danh sách công nợ theo tab/chiều + lọc; sắp quá hạn/gần hạn lên trước. */
export async function getDebts(f: DebtFilters) {
  const page = f.page ?? 0;
  const take = (page + 1) * DEBTS_PAGE_SIZE; // load-more tích luỹ
  const status = f.status ?? "unsettled";
  const today = vnTodayISODate();

  const conds: SQL[] = [eq(debts.direction, f.direction)];
  if (status === "unsettled") conds.push(isNull(debts.settledAt));
  if (status === "settled") conds.push(isNotNull(debts.settledAt));
  if (f.overdueOnly) {
    conds.push(isNull(debts.settledAt));
    conds.push(lt(debts.dueDate, today));
  }
  if (f.q) conds.push(ilike(debts.counterpartyName, `%${f.q}%`));

  const rows = await db
    .select({
      id: debts.id,
      counterpartyName: debts.counterpartyName,
      total: debts.total,
      paid: debts.paid,
      dueDate: debts.dueDate,
      settledAt: debts.settledAt,
      transactionId: debts.transactionId,
      businessLine: transactions.businessLine,
    })
    .from(debts)
    .innerJoin(transactions, eq(transactions.id, debts.transactionId))
    .where(and(...conds))
    // due_date gần nhất lên trước, khoản không hẹn ngày xuống cuối, rồi mới nhất.
    .orderBy(sql`${debts.dueDate} asc nulls last`, desc(transactions.transactedAt))
    .limit(take + 1);

  const hasMore = rows.length > take;
  return { items: hasMore ? rows.slice(0, take) : rows, hasMore };
}

/** Chi tiết 1 công nợ + giao dịch gốc (chỉ đọc). */
export async function getDebtById(id: string) {
  const [row] = await db
    .select({
      id: debts.id,
      direction: debts.direction,
      counterpartyName: debts.counterpartyName,
      total: debts.total,
      paid: debts.paid,
      dueDate: debts.dueDate,
      settledAt: debts.settledAt,
      transactionId: debts.transactionId,
      businessLine: transactions.businessLine,
      transactionType: transactions.type,
      transactionNote: transactions.note,
      transactedAt: transactions.transactedAt,
    })
    .from(debts)
    .innerJoin(transactions, eq(transactions.id, debts.transactionId))
    .where(eq(debts.id, id))
    .limit(1);

  return row ?? null;
}
