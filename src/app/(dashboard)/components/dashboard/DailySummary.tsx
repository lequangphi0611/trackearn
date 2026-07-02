import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/Money";
import { businessLineLabel } from "@/lib/constants";
import type { DailySummary as DailySummaryData } from "@/queries/reports";

/**
 * Thu — chi — lãi nhanh trong ngày, tách mảng (+ Chi phí chung) + tổng + thực
 * thu. "Lãi nhanh" = thu − chi theo amount, KHÁC lãi gộp tháng ở /reports.
 */
export function DailySummary({ data }: { data: DailySummaryData }) {
  const hasActivity = data.total.income > 0 || data.total.expense > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thu chi trong ngày</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasActivity ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Chưa có giao dịch nào trong ngày này.
          </p>
        ) : (
          <div className="flex flex-col text-sm">
            <div className="grid grid-cols-[1fr_auto_auto_auto] items-baseline gap-x-4 pb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <span>Mảng</span>
              <span className="text-right">Thu</span>
              <span className="text-right">Chi</span>
              <span className="text-right">Lãi nhanh</span>
            </div>
            {data.lines
              .filter((l) => l.income > 0 || l.expense > 0)
              .map((l) => (
                <div
                  key={l.businessLine ?? "chung"}
                  className="grid grid-cols-[1fr_auto_auto_auto] items-baseline gap-x-4 border-t border-t-border/70 py-1.5"
                >
                  <span className="truncate">{businessLineLabel(l.businessLine)}</span>
                  <Money amount={l.income} tone="income" className="text-right text-xs" />
                  <Money amount={l.expense} tone="expense" className="text-right text-xs" />
                  <Money
                    amount={l.net}
                    className={
                      l.net >= 0 ? "text-right text-xs" : "text-right text-xs text-expense"
                    }
                  />
                </div>
              ))}
            <div className="grid grid-cols-[1fr_auto_auto_auto] items-baseline gap-x-4 border-t border-t-border py-1.5 font-medium">
              <span>Tổng cộng</span>
              <Money amount={data.total.income} tone="income" className="text-right text-xs" />
              <Money amount={data.total.expense} tone="expense" className="text-right text-xs" />
              <Money
                amount={data.total.net}
                className={
                  data.total.net >= 0
                    ? "text-right text-xs"
                    : "text-right text-xs text-expense"
                }
              />
            </div>
            <p className="border-t border-t-border/70 pt-2 text-xs text-muted-foreground">
              Thực thu (tiền đã nhận):{" "}
              <Money amount={data.total.paidIncome} className="text-foreground" />
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
