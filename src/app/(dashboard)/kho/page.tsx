import Link from "next/link";
import { ChevronRight, Smartphone, Wrench } from "lucide-react";
import { getInStockSummary } from "@/queries/devices";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export default async function KhoPage() {
  const devices = await getInStockSummary();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Kho hàng</h1>

      <div className="flex flex-col gap-3">
        {/* Thiết bị — kho máy mua/bán (Phase 3a) */}
        <Link
          href="/devices"
          className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/40"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Smartphone className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Thiết bị điện tử</p>
            <p className="text-xs text-muted-foreground">
              {devices.count} máy còn hàng · Vốn{" "}
              <span className="font-mono tabular">{formatCurrency(devices.capital)}</span>
            </p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        </Link>

        {/* Phụ tùng xe múc — Phase 3b */}
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4 opacity-60">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Wrench className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Phụ tùng xe múc</p>
            <p className="text-xs text-muted-foreground">Quản lý tồn kho phụ tùng</p>
          </div>
          <Badge variant="muted">Sắp có</Badge>
        </div>
      </div>
    </div>
  );
}
