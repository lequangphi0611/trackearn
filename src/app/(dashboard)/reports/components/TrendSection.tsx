import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlyTrendPoint } from "@/queries/reports";
import { MonthlyTrendLine } from "./charts/MonthlyTrendLine";

/** Xu hướng 12 tháng gần nhất (độc lập với kỳ đang chọn). */
export function TrendSection({ data }: { data: MonthlyTrendPoint[] }) {
  const empty = data.every((p) => p.revenue === 0 && p.profit === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xu hướng 12 tháng</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {empty ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Chưa có dữ liệu 12 tháng gần đây.
          </p>
        ) : (
          <>
            <MonthlyTrendLine data={data} />
            <p className="text-xs text-muted-foreground">
              Lãi = doanh thu − toàn bộ chi phí theo tháng (accrual), cùng cách tính
              với thẻ tổng quan — khác lãi gộp từng mảng.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
