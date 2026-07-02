import { and, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { BUSINESS_LINES, type BusinessLine } from "@/lib/constants";
import { vnDayRange } from "@/lib/date";

// Tổng hợp báo cáo (dashboard ngày + /reports theo kỳ) — toàn bộ theo accrual
// (amount), kèm "thực thu" (paid_amount). Xem docs/spec/reports.md.

export type DailyLineSummary = {
  businessLine: BusinessLine | null; // null = Chi phí chung
  income: number;
  expense: number;
  net: number;
};

export type DailySummary = {
  lines: DailyLineSummary[];
  total: { income: number; expense: number; net: number; paidIncome: number };
};

// Thứ tự hiển thị cố định: 3 mảng rồi Chi phí chung.
const LINE_ORDER: (BusinessLine | null)[] = [...BUSINESS_LINES, null];

/** Thu/chi/lãi nhanh theo mảng (+ Chi phí chung) + thực thu trong 1 ngày VN. */
export async function getDailySummary(dateISO: string): Promise<DailySummary> {
  const { from, to } = vnDayRange(dateISO);

  const rows = await db
    .select({
      businessLine: transactions.businessLine,
      income: sql<string>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'income'), 0)`,
      expense: sql<string>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'expense'), 0)`,
      paidIncome: sql<string>`coalesce(sum(${transactions.paidAmount}) filter (where ${transactions.type} = 'income'), 0)`,
    })
    .from(transactions)
    .where(and(gte(transactions.transactedAt, from), lt(transactions.transactedAt, to)))
    .groupBy(transactions.businessLine);

  const bucket = new Map(rows.map((r) => [r.businessLine, r]));
  const lines = LINE_ORDER.map((line) => {
    const r = bucket.get(line);
    const income = Number(r?.income ?? 0);
    const expense = Number(r?.expense ?? 0);
    return { businessLine: line, income, expense, net: income - expense };
  });

  const total = lines.reduce(
    (acc, l) => ({
      income: acc.income + l.income,
      expense: acc.expense + l.expense,
      net: acc.net + l.net,
      paidIncome: acc.paidIncome,
    }),
    {
      income: 0,
      expense: 0,
      net: 0,
      paidIncome: rows.reduce((s, r) => s + Number(r.paidIncome), 0),
    },
  );

  return { lines, total };
}
