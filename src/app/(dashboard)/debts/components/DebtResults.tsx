import { getDebts, type DebtFilters } from "@/queries/debts";
import { LoadMore } from "@/components/LoadMore";
import { DebtList } from "./DebtList";

export async function DebtResults({
  query,
  moreHref,
}: {
  query: DebtFilters;
  moreHref: string;
}) {
  const { items, hasMore } = await getDebts(query);
  return (
    <div className="flex animate-in flex-col gap-4 fade-in-0 duration-300">
      <DebtList items={items} />
      {hasMore && <LoadMore href={moreHref} />}
    </div>
  );
}
