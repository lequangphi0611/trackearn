import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/format";
import { Money } from "@/components/Money";
import type { getRepairJobs } from "@/queries/repair-jobs";
import { StatusBadge } from "../../transactions/components/StatusBadge";

type Item = Awaited<ReturnType<typeof getRepairJobs>>["items"][number];

export function RepairJobList({
  items,
  highlightFrom,
}: {
  items: Item[];
  highlightFrom?: number;
}) {
  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Chưa có job nào. Bấm <span className="font-medium text-foreground">Tạo job</span> để thêm.
      </p>
    );
  }

  return (
    <ul className="overflow-hidden rounded-lg border border-border">
      {items.map((j, idx) => {
        const total = j.total ?? 0;
        const remaining = total - (j.paidAmount ?? 0);
        return (
          <li key={j.id}>
            <Link
              href={`/repair-jobs/${j.id}`}
              className={cn(
                "flex items-stretch gap-3 border-l-2 border-l-income py-2.5 pr-3 pl-3 transition-colors hover:bg-muted/40",
                idx > 0 && "border-t border-t-border/70",
                highlightFrom !== undefined && idx >= highlightFrom && "row-enter",
              )}
            >
              <div className="min-w-0 flex-1">
                <span className="truncate text-sm font-medium">{j.customerName}</span>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {j.jobDate && <span>{formatDate(j.jobDate)}</span>}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end justify-center gap-1">
                <Money amount={total} tone="income" signed className="text-sm font-semibold" />
                {j.paymentStatus !== "paid" && (
                  <span className="text-[11px] text-muted-foreground">
                    Còn <span className="tabular">{formatCurrency(remaining)}</span>
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center">
                <StatusBadge status={j.paymentStatus ?? "paid"} />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
