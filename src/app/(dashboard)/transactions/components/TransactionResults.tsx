import { getTransactions, type TransactionFilters } from "@/queries/transactions";
import { LoadMore } from "@/components/LoadMore";
import { TransactionList } from "./TransactionList";

// Phần phụ thuộc DB (chậm) tách riêng để stream trong <Suspense>: phần khung
// trang (tiêu đề, bộ lọc) hiện ngay, danh sách hiện skeleton rồi mới tới.
export async function TransactionResults({
  line,
  query,
  moreHref,
}: {
  line: string;
  query: TransactionFilters;
  moreHref: string;
}) {
  const { items, hasMore } = await getTransactions(query);

  return (
    <div className="flex animate-in flex-col gap-4 fade-in-0 duration-300">
      <TransactionList items={items} line={line} />
      {hasMore && <LoadMore href={moreHref} />}
    </div>
  );
}
