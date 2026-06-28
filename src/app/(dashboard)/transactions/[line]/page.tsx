import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getTransactionLine } from "@/lib/transaction-lines";
import type { TransactionFilters } from "@/queries/transactions";
import { vnDateOnly, vnLocalToInstant, vnMonthRange } from "@/lib/date";
import type { PaymentStatus, TransactionType } from "@/lib/payment";
import { buttonVariants } from "@/components/ui/button";
import { TransactionFilters as Filters } from "../components/TransactionFilters";
import { TransactionResults } from "../components/TransactionResults";
import { TransactionListSkeleton } from "../components/TransactionListSkeleton";

type SearchParams = {
  from?: string;
  to?: string;
  type?: string;
  status?: string;
  q?: string;
  page?: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function TransactionListPage({
  params,
  searchParams,
}: {
  params: Promise<{ line: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { line } = await params;
  const config = getTransactionLine(line);
  if (!config) notFound();

  const sp = await searchParams;
  const range = vnMonthRange();
  const fromStr = sp.from || vnDateOnly(range.from);
  const toStr = sp.to || vnDateOnly(new Date(range.to.getTime() - 1));
  const fromInstant = vnLocalToInstant(`${fromStr}T00:00`);
  const toInstant = new Date(vnLocalToInstant(`${toStr}T00:00`).getTime() + DAY_MS);
  const page = Math.max(0, Math.trunc(Number(sp.page) || 0));

  const type =
    sp.type === "income" || sp.type === "expense" ? (sp.type as TransactionType) : undefined;
  const status =
    sp.status === "paid" || sp.status === "partial" || sp.status === "pending"
      ? (sp.status as PaymentStatus)
      : undefined;

  const query: TransactionFilters = {
    businessLine: config.businessLine,
    from: fromInstant,
    to: toInstant,
    type,
    status,
    q: sp.q?.trim() || undefined,
    page,
  };

  const moreParams = new URLSearchParams();
  if (sp.q) moreParams.set("q", sp.q);
  if (sp.type) moreParams.set("type", sp.type);
  if (sp.status) moreParams.set("status", sp.status);
  moreParams.set("from", fromStr);
  moreParams.set("to", toStr);
  moreParams.set("page", String(page + 1));

  // key của Suspense KHÔNG đổi theo page → tải thêm không nhấp nháy skeleton;
  // chỉ đổi theo bộ lọc để hiện skeleton khi đổi điều kiện.
  const filterKey = `${fromStr}|${toStr}|${type ?? ""}|${status ?? ""}|${sp.q ?? ""}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{config.label}</h1>
        <Link href={`/transactions/${line}/new`} className={buttonVariants({ size: "sm" })}>
          <Plus />
          Nhập
        </Link>
      </div>

      <Filters
        line={line}
        params={{ q: sp.q, type: sp.type, status: sp.status, from: fromStr, to: toStr }}
      />

      <Suspense key={filterKey} fallback={<TransactionListSkeleton />}>
        <TransactionResults line={line} query={query} moreHref={`/transactions/${line}?${moreParams}`} />
      </Suspense>
    </div>
  );
}
