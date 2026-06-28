import {
  getSpareParts,
  SPARE_PARTS_PAGE_SIZE,
  type SparePartFilters,
} from "@/queries/spare-parts";
import { LoadMore } from "@/components/LoadMore";
import { SparePartList } from "./SparePartList";

export async function SparePartResults({
  query,
  moreHref,
}: {
  query: SparePartFilters;
  moreHref: string;
}) {
  const { items, hasMore } = await getSpareParts(query);
  const highlightFrom =
    (query.page ?? 0) > 0 ? (query.page ?? 0) * SPARE_PARTS_PAGE_SIZE : undefined;

  return (
    <div className="flex animate-in flex-col gap-4 fade-in-0 duration-300">
      <SparePartList items={items} highlightFrom={highlightFrom} />
      {hasMore && <LoadMore href={moreHref} />}
    </div>
  );
}
