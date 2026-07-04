import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/Money";
import { BUSINESS_LINE_LABELS } from "@/lib/constants";
import { getLineByBusinessLine } from "@/lib/transaction-lines";
import type { LineGrossProfit } from "@/queries/reports";
import { GrossProfitBar } from "./charts/GrossProfitBar";

// Giá vốn xe múc/thiết bị KHÔNG click được — khác nguồn dữ liệu/mốc ngày so
// với /transactions (reports.md §4.5): xe múc = phụ tùng xuất kho
// (repair_job_parts), thiết bị = theo sell_date của máy bán trong kỳ, không
// theo transacted_at của giao dịch mua (máy có thể mua từ kỳ trước).
const COST_OF_GOODS_TOOLTIP: Record<string, string> = {
  xe_muc: "Phụ tùng đã xuất kho — xem ở màn Phụ tùng, không phải danh sách giao dịch.",
  thiet_bi: "Tính theo ngày máy được bán trong kỳ, không theo ngày mua máy.",
};

/**
 * Lãi gộp từng mảng: bảng số liệu + bar so sánh (bar là island client).
 * "Doanh thu"/"Chi phí mảng" click được ở mọi mảng; "Giá vốn" chỉ phụ kiện
 * click được (chi nhập hàng = giao dịch thật); "Lãi gộp" luôn là text
 * (tổng hợp nhiều nguồn, không map 1-1 với 1 danh sách) — xem reports.md §4.5.
 */
export function GrossProfitSection({
  lines,
  from,
  to,
  costOfGoodsCategoryId,
}: {
  lines: LineGrossProfit[];
  from: string;
  to: string;
  costOfGoodsCategoryId: string | null;
}) {
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
            <div className="overflow-x-auto scroll-fade-x">
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
                  {lines.map((l) => {
                    const slug = getLineByBusinessLine(l.businessLine)?.slug;
                    const canLinkCogs = l.businessLine === "phu_kien" && costOfGoodsCategoryId;
                    return (
                      <tr key={l.businessLine} className="border-b border-border/70">
                        <td className="py-1.5 pr-2">
                          {BUSINESS_LINE_LABELS[l.businessLine]}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {slug ? (
                            <Link href={`/transactions/${slug}?type=income&from=${from}&to=${to}`}>
                              <Money
                                amount={l.revenue}
                                className="text-xs underline decoration-muted-foreground/40 underline-offset-4 hover:decoration-current"
                              />
                            </Link>
                          ) : (
                            <Money amount={l.revenue} className="text-xs" />
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {canLinkCogs ? (
                            <Link
                              href={`/transactions/${slug}?type=expense&categoryId=${costOfGoodsCategoryId}&from=${from}&to=${to}`}
                            >
                              <Money
                                amount={l.costOfGoods}
                                className="text-xs underline decoration-muted-foreground/40 underline-offset-4 hover:decoration-current"
                              />
                            </Link>
                          ) : (
                            <span
                              title={COST_OF_GOODS_TOOLTIP[l.businessLine]}
                              className="cursor-help underline decoration-muted-foreground/30 decoration-dotted underline-offset-4"
                            >
                              <Money amount={l.costOfGoods} className="text-xs" />
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {slug && costOfGoodsCategoryId ? (
                            <Link
                              href={`/transactions/${slug}?type=expense&excludeCategoryId=${costOfGoodsCategoryId}&from=${from}&to=${to}`}
                            >
                              <Money
                                amount={l.lineExpense}
                                className="text-xs underline decoration-muted-foreground/40 underline-offset-4 hover:decoration-current"
                              />
                            </Link>
                          ) : (
                            <Money amount={l.lineExpense} className="text-xs" />
                          )}
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
                    );
                  })}
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
