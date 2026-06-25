import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import type { getTransactions } from "@/queries/transactions";
import { StatusBadge } from "./StatusBadge";

type TransactionItem = Awaited<ReturnType<typeof getTransactions>>["items"][number];

export function TransactionList({ items, line }: { items: TransactionItem[]; line: string }) {
  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Chưa có giao dịch nào.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((t) => (
        <li key={t.id}>
          <Link
            href={`/transactions/${line}/${t.id}`}
            className="block rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "text-sm font-semibold",
                  t.type === "income" ? "text-emerald-600" : "text-red-600",
                )}
              >
                {t.type === "income" ? "+" : "−"}
                {formatCurrency(t.amount)}
              </span>
              <StatusBadge status={t.paymentStatus} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span>{formatDateTime(t.transactedAt)}</span>
              {t.paymentStatus !== "paid" && (
                <span>· Còn {formatCurrency(t.amount - t.paidAmount)}</span>
              )}
              {t.categoryName && <span>· {t.categoryName}</span>}
              {t.counterpartyName && <span>· {t.counterpartyName}</span>}
              {t.userName && <span>· {t.userName}</span>}
              {t.sourceKind !== "manual" && <Badge variant="muted">Tự sinh</Badge>}
            </div>
            {t.note && <p className="mt-1 line-clamp-1 text-xs text-foreground/80">{t.note}</p>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
