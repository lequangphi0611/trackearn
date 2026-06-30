import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { DeviceFilters, DeviceStatusFilter } from "@/queries/devices";
import { getStockCapital } from "@/queries/devices";
import { formatCurrency } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { DeviceFilters as Filters } from "./components/DeviceFilters";
import { DeviceResults } from "./components/DeviceResults";
import { DeviceListSkeleton } from "./components/DeviceListSkeleton";

type SearchParams = {
  status?: string;
  q?: string;
  from?: string;
  to?: string;
  page?: string;
};

function parseStatus(v?: string): DeviceStatusFilter {
  return v === "in_stock" || v === "sold" ? v : "all";
}

export default async function DevicesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const status = parseStatus(sp.status);
  const page = Math.max(0, Math.trunc(Number(sp.page) || 0));

  const query: DeviceFilters = {
    status,
    from: sp.from?.trim() || undefined,
    to: sp.to?.trim() || undefined,
    q: sp.q?.trim() || undefined,
    page,
  };

  const stockCapital = await getStockCapital();

  const moreParams = new URLSearchParams();
  if (sp.q) moreParams.set("q", sp.q);
  if (sp.status) moreParams.set("status", sp.status);
  if (sp.from) moreParams.set("from", sp.from);
  if (sp.to) moreParams.set("to", sp.to);
  moreParams.set("page", String(page + 1));

  const filterKey = `${status}|${sp.from ?? ""}|${sp.to ?? ""}|${sp.q ?? ""}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Kho thiết bị</h1>
        <Link href="/devices/new" className={buttonVariants({ size: "sm" })}>
          <Plus />
          Nhập máy
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
        <span className="text-muted-foreground">Tổng vốn tồn: </span>
        <span className="font-mono font-semibold tabular">{formatCurrency(stockCapital)}</span>
      </div>

      <Filters params={{ status: sp.status, q: sp.q, from: sp.from, to: sp.to }} />

      <Suspense key={filterKey} fallback={<DeviceListSkeleton />}>
        <DeviceResults query={query} moreHref={`/devices?${moreParams}`} />
      </Suspense>
    </div>
  );
}
