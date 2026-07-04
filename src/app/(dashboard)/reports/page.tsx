import { redirect } from "next/navigation";
import { getCurrentSession } from "@/queries/session";
import {
  getCostOfGoodsCategoryId,
  getExpenseByCategory,
  getGrossProfitByLine,
  getMonthlyTrend,
  getPeriodSummary,
} from "@/queries/reports";
import {
  isValidISODate,
  vnDateOnly,
  vnPeriodRange,
  vnTodayISODate,
  type ReportPeriod,
} from "@/lib/date";
import { PeriodControls } from "./components/PeriodControls";
import { SummaryCards } from "./components/SummaryCards";
import { GrossProfitSection } from "./components/GrossProfitSection";
import { ExpenseSection } from "./components/ExpenseSection";
import { TrendSection } from "./components/TrendSection";

const PERIODS: ReportPeriod[] = ["month", "quarter", "year"];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; date?: string }>;
}) {
  // Owner-only: gác ở server component, không ở middleware (middleware.md §5).
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.user.role !== "owner") redirect("/");

  const sp = await searchParams;
  const period: ReportPeriod = PERIODS.includes(sp.period as ReportPeriod)
    ? (sp.period as ReportPeriod)
    : "month";
  const date = sp.date && isValidISODate(sp.date) ? sp.date : vnTodayISODate();

  const [summary, grossProfit, expenses, trend, costOfGoodsCategoryId] = await Promise.all([
    getPeriodSummary(period, date),
    getGrossProfitByLine(period, date),
    getExpenseByCategory(period, date),
    getMonthlyTrend(12),
    getCostOfGoodsCategoryId(),
  ]);

  // from/to dạng chuỗi ngày VN inclusive — CÙNG kỳ đang xem, cùng quy ước
  // /transactions/[line] (vnDateOnly(from) và vnDateOnly(to - 1ms)) để số
  // trên báo cáo và danh sách giao dịch lọc ra khớp tuyệt đối (reports.md §4.5).
  const { from, to } = vnPeriodRange(period, date);
  const fromStr = vnDateOnly(from);
  const toStr = vnDateOnly(new Date(to.getTime() - 1));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Báo cáo</h1>
        <p className="text-sm text-muted-foreground">
          Doanh thu, chi phí, lãi theo kỳ — số liệu accrual (theo giao dịch)
        </p>
      </div>

      <PeriodControls period={period} date={date} />
      <SummaryCards summary={summary} from={fromStr} to={toStr} />
      <GrossProfitSection
        lines={grossProfit}
        from={fromStr}
        to={toStr}
        costOfGoodsCategoryId={costOfGoodsCategoryId}
      />
      <ExpenseSection data={expenses} from={fromStr} to={toStr} />
      <TrendSection data={trend} />
    </div>
  );
}
