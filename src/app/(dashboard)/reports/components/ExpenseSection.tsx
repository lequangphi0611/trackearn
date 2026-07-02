import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/Money";
import type { ExpenseByCategory } from "@/queries/reports";
import { ExpenseCategoryBar } from "./charts/ExpenseCategoryBar";

const TOP_CATEGORIES = 10;

/** Chi phí theo danh mục (giảm dần, top 10 + gộp) + chỉ số "Chi phí chung" riêng. */
export function ExpenseSection({ data }: { data: ExpenseByCategory }) {
  const top = data.categories.slice(0, TOP_CATEGORIES);
  const restTotal = data.categories
    .slice(TOP_CATEGORIES)
    .reduce((s, c) => s + c.total, 0);
  const chartData = [
    ...top.map((c) => ({ name: c.name, total: c.total })),
    ...(restTotal > 0 ? [{ name: "Còn lại (gộp)", total: restTotal }] : []),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chi phí theo danh mục</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {data.categories.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Chưa có chi phí nào trong kỳ này.
          </p>
        ) : (
          <>
            <ExpenseCategoryBar data={chartData} />
            <p className="border-t border-border/70 pt-2 text-xs text-muted-foreground">
              Trong đó <span className="font-medium text-foreground">chi phí chung</span>{" "}
              (không thuộc mảng nào):{" "}
              <Money amount={data.generalTotal} className="text-foreground" /> — không
              phân bổ vào lãi gộp mảng.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
