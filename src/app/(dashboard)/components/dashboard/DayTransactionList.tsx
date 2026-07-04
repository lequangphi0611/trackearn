import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatTime, shortCategoryName } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/Money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BUSINESS_LINE_STYLES,
  businessLineLabel,
  type BusinessLine,
} from "@/lib/constants";
import { getLineByBusinessLine } from "@/lib/transaction-lines";
import type { getTransactionsByDate } from "@/queries/transactions";
import { StatusBadge } from "../../transactions/components/StatusBadge";

type Item = Awaited<ReturnType<typeof getTransactionsByDate>>[number];

export function DayTransactionList({
  items,
  title = "Giao dịch trong ngày",
}: {
  items: Item[];
  title?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Chưa có giao dịch nào. Bấm{" "}
            <span className="font-medium text-foreground">Nhập giao dịch</span> để thêm.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-border">
            {items.map((t, idx) => {
              const lineConfig = getLineByBusinessLine(t.businessLine);
              const href = lineConfig
                ? `/transactions/${lineConfig.slug}/${t.id}`
                : undefined;
              const row = (
                <div
                  className={cn(
                    "flex items-center gap-3 border-l-2 py-2.5 pr-3 pl-3",
                    t.type === "income" ? "border-l-income" : "border-l-expense",
                    href && "transition-colors hover:bg-muted/40",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTime(t.transactedAt)}
                      </span>
                      <Badge
                        className={
                          t.businessLine
                            ? BUSINESS_LINE_STYLES[t.businessLine as BusinessLine]
                            : undefined
                        }
                        variant={t.businessLine ? undefined : "muted"}
                      >
                        {businessLineLabel(t.businessLine)}
                      </Badge>
                      <StatusBadge status={t.paymentStatus} />
                      {t.sourceKind !== "manual" && (
                        <Badge variant="muted">Tự sinh</Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {[
                        t.categoryName && shortCategoryName(t.categoryName),
                        t.counterpartyName,
                        t.note,
                        t.userName,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <Money
                    amount={t.amount}
                    tone={t.type === "income" ? "income" : "expense"}
                    signed
                    className="text-sm"
                  />
                </div>
              );
              return (
                <li key={t.id} className={idx > 0 ? "border-t border-t-border/70" : undefined}>
                  {href ? <Link href={href}>{row}</Link> : row}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
