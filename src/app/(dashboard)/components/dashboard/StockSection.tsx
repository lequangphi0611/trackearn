import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Money } from "@/components/Money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type { DeviceStock } from "@/queries/devices";

/** Tồn kho thiết bị (trạng thái hiện tại, không lọc theo ngày xem). */
export function StockSection({ stock }: { stock: DeviceStock }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Tồn kho thiết bị</CardTitle>
        <Link
          href="/devices"
          className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Xem tất cả
          <ChevronRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {stock.items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-center text-sm text-muted-foreground">
              Kho đang trống — chưa có máy nào còn hàng.
            </p>
            <Link
              href="/devices/new"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "max-sm:h-10")}
            >
              <Plus />
              Nhập máy
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <ul className="overflow-hidden rounded-lg border border-border">
              {stock.items.map((d, idx) => (
                <li
                  key={d.id}
                  className={idx > 0 ? "border-t border-t-border/70" : undefined}
                >
                  <Link
                    href={`/devices/${d.id}`}
                    className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{d.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {d.buyDate ? `Mua ${formatDate(d.buyDate)}` : "Chưa rõ ngày mua"}
                        {d.conditionNote ? ` · ${d.conditionNote}` : ""}
                      </p>
                    </div>
                    <Money amount={d.buyPrice} className="text-sm" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-right text-xs text-muted-foreground">
              Tổng vốn tồn:{" "}
              <Money amount={stock.capital} className="font-medium text-foreground" />
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
