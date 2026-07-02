import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/Money";
import { businessLineLabel } from "@/lib/constants";
import type { DailySummary as DailySummaryData } from "@/queries/reports";

/**
 * Thu — chi — lãi nhanh trong ngày, tách mảng (+ Chi phí chung) + tổng + thực
 * thu. "Lãi nhanh" = thu − chi theo amount, KHÁC lãi gộp tháng ở /reports.
 *
 * Layout 2 tầng (tên mảng 1 dòng, 3 số 1 dòng) để 390px không truncate tên
 * hay wrap tiền; ₫ chỉ nằm ở header cột (số dùng <Money bare>).
 */
export function DailySummary({ data }: { data: DailySummaryData }) {
  const hasActivity = data.total.income > 0 || data.total.expense > 0;
  const numberRow = "grid grid-cols-3 gap-x-3 text-right";

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
            <div
              className={`${numberRow} pb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase`}
            >
              <span>Thu (₫)</span>
              <span>Chi (₫)</span>
              <span>Lãi nhanh (₫)</span>
            </div>
            {data.lines
              .filter((l) => l.income > 0 || l.expense > 0)
              .map((l) => (
                <div key={l.businessLine ?? "chung"} className="border-t border-t-border/70 py-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    {businessLineLabel(l.businessLine)}
                  </p>
                  <div className={numberRow}>
                    <Money amount={l.income} tone="income" bare className="text-xs" />
                    <Money amount={l.expense} tone="expense" bare className="text-xs" />
                    <Money
                      amount={l.net}
                      bare
                      className={l.net >= 0 ? "text-xs" : "text-xs text-expense"}
                    />
                  </div>
                </div>
              ))}
            <div className="border-t border-t-border py-1.5 font-medium">
              <p className="text-xs">Tổng cộng</p>
              <div className={numberRow}>
                <Money amount={data.total.income} tone="income" bare className="text-xs" />
                <Money amount={data.total.expense} tone="expense" bare className="text-xs" />
                <Money
                  amount={data.total.net}
                  bare
                  className={data.total.net >= 0 ? "text-xs" : "text-xs text-expense"}
                />
              </div>
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
