import { Suspense } from "react";
import { PackagePlus, HandCoins, Receipt } from "lucide-react";
import type { DeviceFilters, DeviceStatusFilter } from "@/queries/devices";
import { getStockCapital } from "@/queries/devices";
import { formatCurrency } from "@/lib/format";
import { HubCard } from "../components/HubCard";
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
      <h1 className="text-lg font-semibold">Kho thiết bị</h1>

      {/* Hub duy nhất cho thiết bị (menu "+" dẫn thẳng vào đây) — issue #12:
          gộp 3 luồng nhập máy / bán máy / thu-chi khác từng rời rạc. HubCard
          "Nhập máy mới" đã là entry point chính nên KHÔNG còn nút "Nhập máy"
          trùng đích ở header. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <HubCard href="/devices/new" icon={<PackagePlus className="size-5" />} title="Nhập máy mới">
          Mua máy, lưu vào kho
        </HubCard>
        <HubCard
          href="/transactions/thiet-bi/new?mode=sell"
          icon={<HandCoins className="size-5" />}
          title="Bán máy từ kho"
        >
          Chọn máy trong kho để bán
        </HubCard>
        <HubCard
          href="/transactions/thiet-bi/new?mode=income"
          icon={<Receipt className="size-5" />}
          title="Thu / Chi khác"
        >
          Sửa chữa, phụ kiện, chi phí...
        </HubCard>
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
