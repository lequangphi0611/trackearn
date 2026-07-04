import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/Money";
import { shortCategoryName } from "@/lib/format";
import type { ExpenseByCategory } from "@/queries/reports";
import { getLineByBusinessLine } from "@/lib/transaction-lines";
import { ExpenseCategoryBar } from "./charts/ExpenseCategoryBar";

const generalLineSlug = getLineByBusinessLine(null)!.slug;

const TOP_CATEGORIES = 10;

/**
 * Chi phí theo danh mục (giảm dần, top 10 + gộp) + chỉ số "Chi phí chung"
 * riêng. Từng danh mục top 10 và "Chi phí chung" click được → drill-down
 * /transactions (reports.md §4.5); "Còn lại (gộp)" chỉ là text (gộp nhiều
 * danh mục, không có 1 categoryId để lọc đúng).
 */
export function ExpenseSection({
  data,
  from,
  to,
}: {
  data: ExpenseByCategory;
  from: string;
  to: string;
}) {
  const top = data.categories.slice(0, TOP_CATEGORIES);
  const restTotal = data.categories
    .slice(TOP_CATEGORIES)
    .reduce((s, c) => s + c.total, 0);
  const chartData = [
    ...top.map((c) => ({ name: shortCategoryName(c.name), total: c.total })),
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
            <ul className="flex flex-col gap-0.5 text-xs">
              {top.map((c) => (
                <li key={c.categoryId ?? c.name} className="flex items-center justify-between">
                  {c.categoryId ? (
                    <Link
                      href={`/transactions?type=expense&categoryId=${c.categoryId}&from=${from}&to=${to}`}
                      className="flex w-full items-center justify-between gap-2 rounded py-0.5"
                    >
                      <span className="truncate text-muted-foreground">
                        {shortCategoryName(c.name)}
                      </span>
                      <Money
                        amount={c.total}
                        className="shrink-0 underline decoration-muted-foreground/40 underline-offset-4 hover:decoration-current"
                      />
                    </Link>
                  ) : (
                    <>
                      <span className="truncate text-muted-foreground">
                        {shortCategoryName(c.name)}
                      </span>
                      <Money amount={c.total} className="shrink-0" />
                    </>
                  )}
                </li>
              ))}
              {restTotal > 0 && (
                <li className="flex items-center justify-between py-0.5 text-muted-foreground">
                  <span>Còn lại (gộp)</span>
                  <Money amount={restTotal} className="shrink-0" />
                </li>
              )}
            </ul>
            <p className="border-t border-border/70 pt-2 text-xs text-muted-foreground">
              Trong đó{" "}
              <Link
                href={`/transactions/${generalLineSlug}?from=${from}&to=${to}`}
                className="font-medium text-foreground underline decoration-muted-foreground/40 underline-offset-4 hover:decoration-current"
              >
                chi phí chung
              </Link>{" "}
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
