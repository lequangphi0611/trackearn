import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/Money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { isOverdue } from "@/lib/date";
import type { OpenDebt } from "@/queries/debts";

function DebtGroup({ label, items }: { label: string; items: OpenDebt[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <ul className="overflow-hidden rounded-lg border border-border">
        {items.map((d, idx) => {
          // Quá hạn so với HÔM NAY THỰC, không phải ngày đang xem (spec 4.4).
          const overdue = isOverdue(d.dueDate, null);
          return (
            <li
              key={d.id}
              className={idx > 0 ? "border-t border-t-border/70" : undefined}
            >
              <Link
                href={`/debts/${d.id}`}
                className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {d.counterpartyName}
                    </span>
                    {overdue && <Badge variant="danger">Quá hạn</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {d.dueDate ? `Hẹn trả ${formatDate(d.dueDate)}` : "Không hẹn ngày"}
                  </p>
                </div>
                <Money amount={d.total - d.paid} className="text-sm" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Công nợ chưa tất toán (trạng thái hiện tại, không lọc theo ngày xem). */
export function OpenDebtsSection({
  receivable,
  payable,
}: {
  receivable: OpenDebt[];
  payable: OpenDebt[];
}) {
  const empty = receivable.length === 0 && payable.length === 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Công nợ chưa tất toán</CardTitle>
        <Link
          href="/debts"
          className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Xem tất cả
          <ChevronRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {empty ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Không có công nợ nào đang treo. 🎉
          </p>
        ) : (
          <>
            <DebtGroup label="Khách nợ mình" items={receivable} />
            <DebtGroup label="Mình nợ" items={payable} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
