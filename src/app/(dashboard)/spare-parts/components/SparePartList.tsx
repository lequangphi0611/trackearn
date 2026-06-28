import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCurrency, formatQuantity } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import type { getSpareParts } from "@/queries/spare-parts";

type Item = Awaited<ReturnType<typeof getSpareParts>>["items"][number];

/** Trạng thái tồn để cảnh báo: âm < hết (=0) < thấp (<=min) < đủ. */
function stockState(quantity: string, minQuantity: string) {
  const q = Number(quantity);
  const min = Number(minQuantity);
  if (q < 0) return { label: "Tồn âm", variant: "danger" as const, warn: true };
  if (q === 0) return { label: "Hết hàng", variant: "danger" as const, warn: true };
  if (q <= min) return { label: "Sắp hết", variant: "warning" as const, warn: true };
  return null;
}

export function SparePartList({
  items,
  highlightFrom,
}: {
  items: Item[];
  highlightFrom?: number;
}) {
  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Chưa có phụ tùng nào. Bấm <span className="font-medium text-foreground">Nhập phụ tùng</span> để thêm.
      </p>
    );
  }

  return (
    <ul className="overflow-hidden rounded-lg border border-border">
      {items.map((p, idx) => {
        const state = stockState(p.quantity, p.minQuantity);
        return (
          <li key={p.id}>
            <Link
              href={`/spare-parts/${p.id}`}
              className={cn(
                "flex items-stretch gap-3 border-l-2 py-2.5 pr-3 pl-3 transition-colors hover:bg-muted/40",
                state?.warn ? "border-l-expense" : "border-l-income",
                idx > 0 && "border-t border-t-border/70",
                highlightFrom !== undefined && idx >= highlightFrom && "row-enter",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{p.name}</span>
                  {state && <Badge variant={state.variant}>{state.label}</Badge>}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Vốn <span className="font-mono tabular">{formatCurrency(p.buyPrice)}</span>/{p.unit}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end justify-center text-right">
                <span className="text-xs text-muted-foreground">Tồn</span>
                <span className={cn("font-mono font-semibold tabular", state?.warn && "text-expense")}>
                  {formatQuantity(p.quantity, p.unit)}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
