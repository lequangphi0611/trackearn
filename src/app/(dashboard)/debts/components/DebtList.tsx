import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import { isOverdue } from "@/lib/date";
import { Badge } from "@/components/ui/badge";
import { businessLineLabel } from "@/lib/constants";
import type { getDebts } from "@/queries/debts";

type DebtItem = Awaited<ReturnType<typeof getDebts>>["items"][number];

export function DebtList({ items }: { items: DebtItem[] }) {
  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Không có công nợ.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((d) => {
        const remaining = d.total - d.paid;
        const overdue = isOverdue(d.dueDate, d.settledAt);
        return (
          <li key={d.id}>
            <Link
              href={`/debts/${d.id}`}
              className="block rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{d.counterpartyName}</span>
                <span className="text-sm font-semibold">{formatCurrency(remaining)}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Đã trả {formatCurrency(d.paid)} / {formatCurrency(d.total)}
                </span>
                {d.dueDate && <span>· Hẹn {formatDate(d.dueDate)}</span>}
                <span>· {businessLineLabel(d.businessLine)}</span>
                {d.settledAt ? (
                  <Badge variant="success">Đã tất toán</Badge>
                ) : (
                  overdue && <Badge variant="danger">Quá hạn</Badge>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
