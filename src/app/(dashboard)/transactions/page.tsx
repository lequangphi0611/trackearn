import { Suspense } from "react";
import { TransactionFilters as Filters } from "./components/TransactionFilters";
import { TransactionResults } from "./components/TransactionResults";
import { TransactionListSkeleton } from "./components/TransactionListSkeleton";
import { TransactionLineTabs } from "./components/TransactionLineTabs";
import { parseTransactionListParams, type TransactionListSearchParams } from "./list-params";

// View tổng hợp — không lọc business_line (kể cả NULL/chi phí chung), thay
// thế menu tĩnh cũ (xem transactions.md §2). Không có nút "Nhập": phải vào
// đúng 1 mảng để gán business_line_id (transactions.md §2).
export default async function TransactionsIndexPage({
  searchParams,
}: {
  searchParams: Promise<TransactionListSearchParams>;
}) {
  const sp = await searchParams;
  const { query, moreParams, filterKey, fromStr, toStr } = parseTransactionListParams(
    sp,
    undefined,
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Giao dịch</h1>

      <TransactionLineTabs active={null} searchParams={sp} />

      <Filters
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
        <TransactionResults query={query} moreHref={`/transactions?${moreParams}`} aggregate />
      </Suspense>
    </div>
  );
}
