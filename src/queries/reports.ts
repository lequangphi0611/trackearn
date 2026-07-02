import { and, eq, gte, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  devices,
  expenseCategories,
  repairJobParts,
  repairJobs,
  transactions,
} from "@/db/schema";
import { BUSINESS_LINES, type BusinessLine } from "@/lib/constants";
import {
  vnDateOnly,
  vnDayRange,
  vnLastNMonths,
  vnPeriodRange,
  type ReportPeriod,
} from "@/lib/date";

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

// coalesce(sum(...) filter (where type = ...), 0) lặp lại ở nhiều hàm dưới —
// gom 2 dạng hay dùng nhất (theo amount / theo paid_amount) để khỏi gõ lại
// cùng 1 template SQL nhiều nơi.
function sumByType(type: "income" | "expense") {
  return sql<string>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = ${type}), 0)`;
}
function sumPaidByType(type: "income" | "expense") {
  return sql<string>`coalesce(sum(${transactions.paidAmount}) filter (where ${transactions.type} = ${type}), 0)`;
}

/** Thu/chi/lãi nhanh theo mảng (+ Chi phí chung) + thực thu trong 1 ngày VN. */
export async function getDailySummary(dateISO: string): Promise<DailySummary> {
  const { from, to } = vnDayRange(dateISO);

  const rows = await db
    .select({
      businessLine: transactions.businessLine,
      income: sumByType("income"),
      expense: sumByType("expense"),
      paidIncome: sumPaidByType("income"),
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

// ---------------------------------------------------------------------------
// Báo cáo theo kỳ (/reports, owner only) — kỳ tháng/quý/năm theo giờ VN.
// ---------------------------------------------------------------------------

export type PeriodSummary = {
  revenue: number;
  expense: number;
  profit: number;
  paidIncome: number;
  prev: { revenue: number; expense: number; profit: number };
};

async function sumPeriod(from: Date, to: Date) {
  const [row] = await db
    .select({
      revenue: sumByType("income"),
      expense: sumByType("expense"),
      paidIncome: sumPaidByType("income"),
    })
    .from(transactions)
    .where(and(gte(transactions.transactedAt, from), lt(transactions.transactedAt, to)));
  const revenue = Number(row?.revenue ?? 0);
  const expense = Number(row?.expense ?? 0);
  return { revenue, expense, paidIncome: Number(row?.paidIncome ?? 0) };
}

/**
 * Tổng quan kỳ: doanh thu / chi phí (TOÀN BỘ expense, gồm giá vốn + chi phí
 * chung) / lãi + thực thu, kèm kỳ liền trước để tính % thay đổi.
 */
export async function getPeriodSummary(
  period: ReportPeriod,
  dateISO: string,
): Promise<PeriodSummary> {
  const { from, to, prevFrom, prevTo } = vnPeriodRange(period, dateISO);
  const [cur, prev] = await Promise.all([
    sumPeriod(from, to),
    sumPeriod(prevFrom, prevTo),
  ]);
  return {
    revenue: cur.revenue,
    expense: cur.expense,
    profit: cur.revenue - cur.expense,
    paidIncome: cur.paidIncome,
    prev: {
      revenue: prev.revenue,
      expense: prev.expense,
      profit: prev.revenue - prev.expense,
    },
  };
}

export type LineGrossProfit = {
  businessLine: BusinessLine;
  revenue: number;
  costOfGoods: number;
  lineExpense: number;
  grossProfit: number;
};

/**
 * Lãi gộp từng mảng trong kỳ (công thức reports.md §3.2):
 * - xe_muc:   Σ income mảng − Σ giá vốn phụ tùng xuất (cost_price×qty) − chi phí mảng
 * - thiet_bi: Σ(sell−buy) máy bán trong kỳ + thu khác (≠ device_sell) − chi phí mảng
 * - phu_kien: Σ income − chi phí nhập (cost_of_goods) − chi phí mảng
 * "Chi phí mảng" = expense có business_line, KHÔNG gồm cost_of_goods (đã trừ
 * dạng giá vốn) và không gồm chi phí chung (business_line NULL).
 */
export async function getGrossProfitByLine(
  period: ReportPeriod,
  dateISO: string,
): Promise<LineGrossProfit[]> {
  const { from, to } = vnPeriodRange(period, dateISO);
  const inPeriod = and(
    gte(transactions.transactedAt, from),
    lt(transactions.transactedAt, to),
  );
  // devices.sell_date là cột date (chuỗi) — so theo ngày VN của ranh giới kỳ.
  const fromDate = vnDateOnly(from);
  const toDate = vnDateOnly(to);

  const [incomeRows, expenseRows, cogsRows, [partsRow], [deviceRow]] =
    await Promise.all([
      // Thu theo mảng + phần "thu khác" không phải bán máy (cho thiet_bi).
      db
        .select({
          businessLine: transactions.businessLine,
          income: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
          otherIncome: sql<string>`coalesce(sum(${transactions.amount}) filter (where ${transactions.sourceKind} <> 'device_sell'), 0)`,
        })
        .from(transactions)
        .where(and(inPeriod, eq(transactions.type, "income"), isNotNull(transactions.businessLine)))
        .groupBy(transactions.businessLine),
      // Chi phí mảng (loại giá vốn).
      db
        .select({
          businessLine: transactions.businessLine,
          total: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
        })
        .from(transactions)
        .leftJoin(expenseCategories, eq(expenseCategories.id, transactions.categoryId))
        .where(
          and(
            inPeriod,
            eq(transactions.type, "expense"),
            isNotNull(transactions.businessLine),
            or(isNull(expenseCategories.slug), sql`${expenseCategories.slug} <> 'cost_of_goods'`),
          ),
        )
        .groupBy(transactions.businessLine),
      // Chi phí nhập hàng (cost_of_goods) theo mảng — dùng cho phu_kien.
      db
        .select({
          businessLine: transactions.businessLine,
          total: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
        })
        .from(transactions)
        .innerJoin(expenseCategories, eq(expenseCategories.id, transactions.categoryId))
        .where(
          and(
            inPeriod,
            eq(transactions.type, "expense"),
            isNotNull(transactions.businessLine),
            eq(expenseCategories.slug, "cost_of_goods"),
          ),
        )
        .groupBy(transactions.businessLine),
      // Giá vốn phụ tùng xuất cho job trong kỳ — bucket theo transacted_at của
      // income transaction của job để giá vốn & doanh thu cùng kỳ.
      db
        .select({
          total: sql<string>`coalesce(round(sum(${repairJobParts.costPrice} * ${repairJobParts.quantity})), 0)`,
        })
        .from(repairJobParts)
        .innerJoin(repairJobs, eq(repairJobs.id, repairJobParts.jobId))
        .innerJoin(transactions, eq(transactions.id, repairJobs.transactionId))
        .where(inPeriod),
      // Máy bán trong kỳ ("bán trong kỳ" = sell_date thuộc kỳ, trùng mốc
      // accrual của income bán). Hủy bán revert status → tự loại.
      db
        .select({
          margin: sql<string>`coalesce(sum(${devices.sellPrice} - ${devices.buyPrice}), 0)`,
          sellTotal: sql<string>`coalesce(sum(${devices.sellPrice}), 0)`,
          buyTotal: sql<string>`coalesce(sum(${devices.buyPrice}), 0)`,
        })
        .from(devices)
        .where(
          and(
            eq(devices.status, "sold"),
            gte(devices.sellDate, fromDate),
            lt(devices.sellDate, toDate),
          ),
        ),
    ]);

  const income = new Map(incomeRows.map((r) => [r.businessLine, r]));
  const lineExpense = new Map(expenseRows.map((r) => [r.businessLine, Number(r.total)]));
  const cogs = new Map(cogsRows.map((r) => [r.businessLine, Number(r.total)]));
  const partsCost = Number(partsRow?.total ?? 0);
  const deviceMargin = Number(deviceRow?.margin ?? 0);
  const deviceSellTotal = Number(deviceRow?.sellTotal ?? 0);
  const deviceBuyTotal = Number(deviceRow?.buyTotal ?? 0);

  return BUSINESS_LINES.map((line): LineGrossProfit => {
    const expense = lineExpense.get(line) ?? 0;
    const totalIncome = Number(income.get(line)?.income ?? 0);

    if (line === "xe_muc") {
      return {
        businessLine: line,
        revenue: totalIncome,
        costOfGoods: partsCost,
        lineExpense: expense,
        grossProfit: totalIncome - partsCost - expense,
      };
    }
    if (line === "thiet_bi") {
      // Doanh thu/giá vốn hiển thị theo tiền bán/mua máy cho cột đọc tự
      // nhiên; lãi gộp vẫn theo công thức margin + thu khác − chi phí mảng.
      const otherIncome = Number(income.get(line)?.otherIncome ?? 0);
      return {
        businessLine: line,
        revenue: otherIncome + deviceSellTotal,
        costOfGoods: deviceBuyTotal,
        lineExpense: expense,
        grossProfit: deviceMargin + otherIncome - expense,
      };
    }
    const lineCogs = cogs.get(line) ?? 0;
    return {
      businessLine: line,
      revenue: totalIncome,
      costOfGoods: lineCogs,
      lineExpense: expense,
      grossProfit: totalIncome - lineCogs - expense,
    };
  });
}

export type ExpenseByCategory = {
  categories: { categoryId: string | null; name: string; total: number }[];
  generalTotal: number;
};

/**
 * Chi phí theo danh mục trong kỳ (TOÀN BỘ expense, gồm cả chi phí chung),
 * giảm dần; kèm tổng "Chi phí chung" (business_line NULL) như chỉ số riêng —
 * không trừ khỏi nhóm danh mục (spec screens/reports.md §4.3).
 */
export async function getExpenseByCategory(
  period: ReportPeriod,
  dateISO: string,
): Promise<ExpenseByCategory> {
  const { from, to } = vnPeriodRange(period, dateISO);
  const inPeriod = and(
    gte(transactions.transactedAt, from),
    lt(transactions.transactedAt, to),
    eq(transactions.type, "expense"),
  );

  const [rows, [generalRow]] = await Promise.all([
    db
      .select({
        categoryId: transactions.categoryId,
        name: sql<string>`coalesce(${expenseCategories.name}, 'Khác')`,
        total: sql<string>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .leftJoin(expenseCategories, eq(expenseCategories.id, transactions.categoryId))
      .where(inPeriod)
      .groupBy(transactions.categoryId, expenseCategories.name)
      .orderBy(sql`sum(${transactions.amount}) desc`),
    db
      .select({ total: sql<string>`coalesce(sum(${transactions.amount}), 0)` })
      .from(transactions)
      .where(and(inPeriod, isNull(transactions.businessLine))),
  ]);

  return {
    categories: rows.map((r) => ({ ...r, total: Number(r.total) })),
    generalTotal: Number(generalRow?.total ?? 0),
  };
}

export type MonthlyTrendPoint = { month: string; revenue: number; profit: number };

/**
 * Xu hướng N tháng gần nhất (doanh thu & lãi theo tháng VN). "Lãi" ở đây =
 * doanh thu − TOÀN BỘ chi phí (accrual) — cùng định nghĩa với card tổng quan
 * kỳ, KHÔNG phải lãi gộp từng mảng.
 */
export async function getMonthlyTrend(months = 12): Promise<MonthlyTrendPoint[]> {
  const { from, to, months: keys } = vnLastNMonths(months);
  const monthExpr = sql<string>`to_char(${transactions.transactedAt} at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM')`;

  const rows = await db
    .select({
      month: monthExpr,
      revenue: sumByType("income"),
      expense: sumByType("expense"),
    })
    .from(transactions)
    .where(and(gte(transactions.transactedAt, from), lt(transactions.transactedAt, to)))
    .groupBy(monthExpr);

  const bucket = new Map(rows.map((r) => [r.month, r]));
  return keys.map((month) => {
    const r = bucket.get(month);
    const revenue = Number(r?.revenue ?? 0);
    const expense = Number(r?.expense ?? 0);
    return { month, revenue, profit: revenue - expense };
  });
}
