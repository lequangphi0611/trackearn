import { cn } from "@/lib/utils";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getTransactionLine } from "@/lib/transaction-lines";
import { buttonVariants } from "@/components/ui/button";
import { TransactionFilters as Filters } from "../components/TransactionFilters";
import { TransactionResults } from "../components/TransactionResults";
import { TransactionListSkeleton } from "../components/TransactionListSkeleton";
import { TransactionLineTabs } from "../components/TransactionLineTabs";
import { parseTransactionListParams, type TransactionListSearchParams } from "../list-params";

export default async function TransactionListPage({
  params,
  searchParams,
}: {
  params: Promise<{ line: string }>;
  searchParams: Promise<TransactionListSearchParams>;
}) {
  const { line } = await params;
  const config = getTransactionLine(line);
  if (!config) notFound();

  const sp = await searchParams;
  const { query, moreParams, filterKey, fromStr, toStr } = parseTransactionListParams(
    sp,
    config.businessLine,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{config.label}</h1>
        <Link href={`/transactions/${line}/new`} className={cn(buttonVariants({ size: "sm" }), "max-sm:h-10")}>
          <Plus />
          Nhập
        </Link>
      </div>

      <TransactionLineTabs active={line} searchParams={sp} />

      <Filters
        line={line}
        params={{
          q: sp.q,
          type: sp.type,
          status: sp.status,
          from: fromStr,
          to: toStr,
          categoryId: sp.categoryId,
          excludeCategoryId: sp.excludeCategoryId,
        }}
      />

      <Suspense key={filterKey} fallback={<TransactionListSkeleton />}>
        <TransactionResults query={query} moreHref={`/transactions/${line}?${moreParams}`} />
      </Suspense>
    </div>
  );
}
