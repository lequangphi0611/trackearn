import { Suspense } from "react";
import type { DebtFilters, DebtStatusFilter } from "@/queries/debts";
import type { DebtDirection } from "@/lib/payment";
import { DebtFilters as Filters } from "./components/DebtFilters";
import { DebtTabsAsync } from "./components/DebtTabsAsync";
import { DebtResults } from "./components/DebtResults";
import { DebtListSkeleton, DebtTabsSkeleton } from "./components/DebtSkeletons";

type SearchParams = {
  dir?: string;
  status?: string;
  overdue?: string;
  q?: string;
  page?: string;
};

export default async function DebtsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const dir: DebtDirection = sp.dir === "payable" ? "payable" : "receivable";
  const status: DebtStatusFilter =
    sp.status === "settled" || sp.status === "all" ? sp.status : "unsettled";
  const overdue = sp.overdue === "1";
  const page = Math.max(0, Math.trunc(Number(sp.page) || 0));

  const query: DebtFilters = {
    direction: dir,
    status,
    overdueOnly: overdue,
    q: sp.q?.trim() || undefined,
    page,
  };

  const moreParams = new URLSearchParams();
  moreParams.set("dir", dir);
  moreParams.set("status", status);
  if (overdue) moreParams.set("overdue", "1");
  if (sp.q) moreParams.set("q", sp.q);
  moreParams.set("page", String(page + 1));

  const filterKey = `${dir}|${status}|${overdue}|${sp.q ?? ""}`;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Công nợ</h1>

      <Suspense fallback={<DebtTabsSkeleton />}>
        <DebtTabsAsync dir={dir} />
      </Suspense>

      <Filters dir={dir} params={{ status, overdue, q: sp.q }} />

      <Suspense key={filterKey} fallback={<DebtListSkeleton />}>
        <DebtResults query={query} moreHref={`/debts?${moreParams}`} />
      </Suspense>
    </div>
  );
}
