import { redirect } from "next/navigation";
import { getCurrentSession } from "@/queries/session";
import {
  getExpenseByCategory,
  getGrossProfitByLine,
  getMonthlyTrend,
  getPeriodSummary,
} from "@/queries/reports";
import { isValidISODate, vnTodayISODate, type ReportPeriod } from "@/lib/date";
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

  const [summary, grossProfit, expenses, trend] = await Promise.all([
    getPeriodSummary(period, date),
    getGrossProfitByLine(period, date),
    getExpenseByCategory(period, date),
    getMonthlyTrend(12),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Báo cáo</h1>
        <p className="text-sm text-muted-foreground">
          Doanh thu, chi phí, lãi theo kỳ — số liệu accrual (theo giao dịch)
        </p>
      </div>

      <PeriodControls period={period} date={date} />
      <SummaryCards summary={summary} />
      <GrossProfitSection lines={grossProfit} />
      <ExpenseSection data={expenses} />
      <TrendSection data={trend} />
    </div>
  );
}
