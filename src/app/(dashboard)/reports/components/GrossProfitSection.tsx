import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/Money";
import { BUSINESS_LINE_LABELS } from "@/lib/constants";
import type { LineGrossProfit } from "@/queries/reports";
import { GrossProfitBar } from "./charts/GrossProfitBar";

/** Lãi gộp từng mảng: bảng số liệu + bar so sánh (bar là island client). */
export function GrossProfitSection({ lines }: { lines: LineGrossProfit[] }) {
  const empty = lines.every(
    (l) => l.revenue === 0 && l.costOfGoods === 0 && l.lineExpense === 0,
  );
  const chartData = lines.map((l) => ({
    label: BUSINESS_LINE_LABELS[l.businessLine],
    grossProfit: l.grossProfit,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lãi gộp từng mảng</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {empty ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Chưa có dữ liệu trong kỳ này.
          </p>
        ) : (
          <>
            <GrossProfitBar data={chartData} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
                    <th className="py-1.5 pr-2 text-left font-medium">Mảng</th>
                    <th className="px-2 py-1.5 text-right font-medium">Doanh thu</th>
                    <th className="px-2 py-1.5 text-right font-medium">Giá vốn</th>
                    <th className="px-2 py-1.5 text-right font-medium">Chi phí mảng</th>
                    <th className="py-1.5 pl-2 text-right font-medium">Lãi gộp</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.businessLine} className="border-b border-border/70">
                      <td className="py-1.5 pr-2">
                        {BUSINESS_LINE_LABELS[l.businessLine]}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <Money amount={l.revenue} className="text-xs" />
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <Money amount={l.costOfGoods} className="text-xs" />
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <Money amount={l.lineExpense} className="text-xs" />
                      </td>
                      <td className="py-1.5 pl-2 text-right">
                        <Money
                          amount={l.grossProfit}
                          className={cn(
                            "text-xs font-medium",
                            l.grossProfit < 0 && "text-expense",
                          )}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              Giá vốn: xe múc = phụ tùng đã xuất; thiết bị = tiền mua máy đã bán;
              phụ kiện = chi nhập hàng. Chi phí mảng không gồm giá vốn và chi phí chung.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
