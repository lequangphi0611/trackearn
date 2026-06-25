import Link from "next/link";
import { getDebts, getDebtRemainingTotal, type DebtStatusFilter } from "@/queries/debts";
import type { DebtDirection } from "@/lib/payment";
import { buttonVariants } from "@/components/ui/button";
import { DebtTabs } from "./components/DebtTabs";
import { DebtFilters } from "./components/DebtFilters";
import { DebtList } from "./components/DebtList";

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

  const [receivableTotal, payableTotal, list] = await Promise.all([
    getDebtRemainingTotal("receivable"),
    getDebtRemainingTotal("payable"),
    getDebts({ direction: dir, status, overdueOnly: overdue, q: sp.q?.trim() || undefined, page }),
  ]);

  const moreParams = new URLSearchParams();
  moreParams.set("dir", dir);
  moreParams.set("status", status);
  if (overdue) moreParams.set("overdue", "1");
  if (sp.q) moreParams.set("q", sp.q);
  moreParams.set("page", String(page + 1));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Công nợ</h1>
      <DebtTabs dir={dir} receivableTotal={receivableTotal} payableTotal={payableTotal} />
      <DebtFilters dir={dir} params={{ status, overdue, q: sp.q }} />
      <DebtList items={list.items} />
      {list.hasMore && (
        <Link
          href={`/debts?${moreParams.toString()}`}
          className={buttonVariants({ variant: "outline", size: "sm", className: "self-center" })}
        >
          Xem thêm
        </Link>
      )}
    </div>
  );
}
