import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/Money";
import { formatPercentChange } from "@/lib/format";
import type { PeriodSummary } from "@/queries/reports";

function ChangeBadge({
  current,
  prev,
  upIsGood,
}: {
  current: number;
  prev: number;
  upIsGood: boolean;
}) {
  const text = formatPercentChange(current, prev);
  // Kỳ trước = 0 → "—", không chia 0 (reports.md §6.4).
  if (text === null) {
    return <span className="text-xs text-muted-foreground">— so kỳ trước</span>;
  }
  const up = current >= prev;
  const good = up === upIsGood;
  return (
    <span
      className={cn(
        "text-xs font-medium",
        current === prev ? "text-muted-foreground" : good ? "text-income" : "text-expense",
      )}
    >
      {text} so kỳ trước
    </span>
  );
}

/**
 * Cards tổng quan kỳ: doanh thu / chi phí / lãi (accrual) + thực thu + % so
 * kỳ trước. "Doanh thu"/"Chi phí" click được → drill-down /transactions
 * (reports.md §4.5); "Lãi"/"Thực thu" chỉ hiển thị, không phải link (hiệu số
 * hoặc khác nguồn, không map 1-1 với 1 danh sách giao dịch).
 */
export function SummaryCards({
  summary,
  from,
  to,
}: {
  summary: PeriodSummary;
  from: string;
  to: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <Card>
        <CardContent className="flex flex-col gap-1 p-4">
          <Link
            href={`/transactions?type=income&from=${from}&to=${to}`}
            className="flex flex-col gap-1 rounded"
          >
            <span className="text-xs text-muted-foreground">Doanh thu</span>
            <Money
              amount={summary.revenue}
              tone="income"
              className="text-lg font-semibold underline decoration-muted-foreground/40 underline-offset-4 hover:decoration-current"
            />
          </Link>
          <ChangeBadge current={summary.revenue} prev={summary.prev.revenue} upIsGood />
          <span className="text-xs text-muted-foreground">
            Thực thu: <Money amount={summary.paidIncome} className="text-foreground" />
          </span>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-1 p-4">
          <Link
            href={`/transactions?type=expense&from=${from}&to=${to}`}
            className="flex flex-col gap-1 rounded"
          >
            <span className="text-xs text-muted-foreground">Chi phí</span>
            <Money
              amount={summary.expense}
              tone="expense"
              className="text-lg font-semibold underline decoration-muted-foreground/40 underline-offset-4 hover:decoration-current"
            />
          </Link>
          <ChangeBadge
            current={summary.expense}
            prev={summary.prev.expense}
            upIsGood={false}
          />
          <span className="text-xs text-muted-foreground">
            Gồm giá vốn & chi phí chung
          </span>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-1 p-4">
          <span className="text-xs text-muted-foreground">Lãi</span>
          <Money
            amount={summary.profit}
            className={cn("text-lg font-semibold", summary.profit < 0 && "text-expense")}
          />
          <ChangeBadge current={summary.profit} prev={summary.prev.profit} upIsGood />
          <span className="text-xs text-muted-foreground">= Doanh thu − Chi phí</span>
        </CardContent>
      </Card>
    </div>
  );
}
