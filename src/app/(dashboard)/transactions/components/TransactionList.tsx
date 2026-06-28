import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { vnDateOnly } from "@/lib/date";
import { Money } from "@/components/Money";
import { Badge } from "@/components/ui/badge";
import type { getTransactions } from "@/queries/transactions";
import { StatusBadge } from "./StatusBadge";

type TransactionItem = Awaited<ReturnType<typeof getTransactions>>["items"][number];

type IndexedItem = { t: TransactionItem; index: number };

function groupByDay(items: TransactionItem[]) {
  const groups: { day: Date; rows: IndexedItem[] }[] = [];
  items.forEach((t, index) => {
    const dayKey = vnDateOnly(new Date(t.transactedAt));
    const last = groups.at(-1);
    if (last && vnDateOnly(last.day) === dayKey) last.rows.push({ t, index });
    else groups.push({ day: new Date(t.transactedAt), rows: [{ t, index }] });
  });
  return groups;
}

function sumByType(rows: IndexedItem[], type: string) {
  return rows.reduce((s, { t }) => (t.type === type ? s + t.amount : s), 0);
}

export function TransactionList({
  items,
  line,
  highlightFrom,
}: {
  items: TransactionItem[];
  line: string;
  // Dòng có chỉ số >= mốc này là vừa tải thêm → cho hiệu ứng "dòng mới".
  highlightFrom?: number;
}) {
  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Chưa có giao dịch nào. Bấm <span className="font-medium text-foreground">Nhập</span> để
        thêm dòng đầu tiên.
      </p>
    );
  }

  const groups = groupByDay(items);

  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => {
        const income = sumByType(g.rows, "income");
        const expense = sumByType(g.rows, "expense");
        return (
          <section key={g.day.toISOString()} className="flex flex-col">
            <div className="flex items-baseline justify-between px-1 pb-1.5">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {formatDate(g.day)}
              </span>
              <span className="flex gap-3 text-xs">
                {income > 0 && <Money amount={income} tone="income" signed />}
                {expense > 0 && <Money amount={expense} tone="expense" signed />}
              </span>
            </div>
            <ul className="overflow-hidden rounded-lg border border-border">
              {g.rows.map(({ t, index }, idx) => (
                <li key={t.id}>
                  <Link
                    href={`/transactions/${line}/${t.id}`}
                    className={cn(
                      "flex items-stretch gap-3 border-l-2 py-2.5 pr-3 pl-3 transition-colors hover:bg-muted/40",
                      t.type === "income" ? "border-l-income" : "border-l-expense",
                      idx > 0 && "border-t border-t-border/70",
                      highlightFrom !== undefined && index >= highlightFrom && "row-enter",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {t.counterpartyName || t.note || t.categoryName || "Giao dịch"}
                        </span>
                        {t.sourceKind !== "manual" && <Badge variant="muted">Tự sinh</Badge>}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        <span className="tabular">{formatTime(t.transactedAt)}</span>
                        {t.categoryName && <span>· {t.categoryName}</span>}
                        {t.userName && <span>· {t.userName}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end justify-center gap-1">
                      <Money
                        amount={t.amount}
                        tone={t.type === "income" ? "income" : "expense"}
                        signed
                        className="text-sm font-semibold"
                      />
                      {t.paymentStatus === "paid" ? null : (
                        <span className="text-[11px] text-muted-foreground">
                          Còn <span className="tabular">{formatCurrency(t.amount - t.paidAmount)}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center">
                      <StatusBadge status={t.paymentStatus} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
