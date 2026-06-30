import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/format";
import { Money } from "@/components/Money";
import { Badge } from "@/components/ui/badge";
import type { getDevices } from "@/queries/devices";

type DeviceItem = Awaited<ReturnType<typeof getDevices>>["items"][number];

export function DeviceList({
  items,
  highlightFrom,
}: {
  items: DeviceItem[];
  // Dòng có chỉ số >= mốc này là vừa tải thêm → hiệu ứng "dòng mới".
  highlightFrom?: number;
}) {
  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Chưa có máy nào. Bấm <span className="font-medium text-foreground">Nhập máy</span> để thêm.
      </p>
    );
  }

  return (
    <ul className="overflow-hidden rounded-lg border border-border">
      {items.map((d, idx) => {
        const sold = d.status === "sold";
        const profit = sold && d.sellPrice !== null ? d.sellPrice - d.buyPrice : null;
        return (
          <li key={d.id}>
            <Link
              href={`/devices/${d.id}`}
              className={cn(
                "flex items-stretch gap-3 border-l-2 py-2.5 pr-3 pl-3 transition-colors hover:bg-muted/40",
                sold ? "border-l-muted" : "border-l-income",
                idx > 0 && "border-t border-t-border/70",
                highlightFrom !== undefined && idx >= highlightFrom && "row-enter",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{d.name}</span>
                  <Badge variant={sold ? "muted" : "success"}>
                    {sold ? "Đã bán" : "Còn hàng"}
                  </Badge>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  {d.conditionNote && <span className="truncate">{d.conditionNote}</span>}
                  {d.buyDate && <span>· Mua {formatDate(d.buyDate)}</span>}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end justify-center gap-1 text-right">
                <span className="text-xs text-muted-foreground">
                  Vốn <span className="font-mono tabular">{formatCurrency(d.buyPrice)}</span>
                </span>
                {sold && d.sellPrice !== null && (
                  <span className="text-xs text-muted-foreground">
                    Bán <span className="font-mono tabular">{formatCurrency(d.sellPrice)}</span>
                  </span>
                )}
                {profit !== null && (
                  <Money
                    amount={Math.abs(profit)}
                    tone={profit >= 0 ? "income" : "expense"}
                    signed
                    className="text-sm font-semibold"
                  />
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
