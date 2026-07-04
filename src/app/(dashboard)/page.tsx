import { redirect } from "next/navigation";
import { getCurrentSession } from "@/queries/session";
import { getDailySummary } from "@/queries/reports";
import { getMyTransactionsByDate, getTransactionsByDate } from "@/queries/transactions";
import { getOpenDebts } from "@/queries/debts";
import { getDeviceStock, getInStockDevicesForPicker } from "@/queries/devices";
import { getExpenseCategories } from "@/queries/expense-categories";
import { isValidISODate, vnDateTimeLocal, vnTodayISODate } from "@/lib/date";
import { formatDate } from "@/lib/format";
import { QuickEntryDialog } from "./components/dashboard/QuickEntryDialog";
import { DateNav } from "./components/dashboard/DateNav";
import { DailySummary } from "./components/dashboard/DailySummary";
import { DayTransactionList } from "./components/dashboard/DayTransactionList";
import { OpenDebtsSection } from "./components/dashboard/OpenDebtsSection";
import { StockSection } from "./components/dashboard/StockSection";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const today = vnTodayISODate();
  const date = sp.date && isValidISODate(sp.date) ? sp.date : today;
  const isOwner = session.user.role === "owner";

  // Dữ liệu tác nghiệp cho form nhập nhanh (cả 2 role đều nhập được).
  const [categories, devices] = await Promise.all([
    getExpenseCategories(),
    getInStockDevicesForPicker(),
  ]);

  const quickEntry = (
    <QuickEntryDialog
      devices={devices}
      categories={categories}
      defaultDateTime={vnDateTimeLocal()}
      defaultDate={today}
    />
  );

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h1 className="text-lg font-semibold">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">
          {date === today ? "Hôm nay, " : ""}
          {formatDate(date)}
        </p>
      </div>
      <DateNav date={date} />
    </div>
  );

  // Member: bản rút gọn — chỉ nhập nhanh + giao dịch của mình, KHÔNG fetch
  // các query tổng hợp (spec dashboard.md §5, §8).
  if (!isOwner) {
    const myTransactions = await getMyTransactionsByDate(date, session.user.id);
    return (
      <div className="flex flex-col gap-4">
        {header}
        {quickEntry}
        <DayTransactionList items={myTransactions} title="Giao dịch của tôi trong ngày" />
      </div>
    );
  }

  const [summary, dayTransactions, openDebts, stock] = await Promise.all([
    getDailySummary(date),
    getTransactionsByDate(date),
    getOpenDebts(),
    getDeviceStock(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      {header}
      {quickEntry}
      <DailySummary data={summary} />
      <DayTransactionList items={dayTransactions} />
      <OpenDebtsSection receivable={openDebts.receivable} payable={openDebts.payable} />
      <StockSection stock={stock} />
    </div>
  );
}
