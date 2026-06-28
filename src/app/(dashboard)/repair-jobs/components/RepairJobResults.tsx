import {
  getRepairJobs,
  REPAIR_JOBS_PAGE_SIZE,
  type RepairJobFilters,
} from "@/queries/repair-jobs";
import { LoadMore } from "@/components/LoadMore";
import { RepairJobList } from "./RepairJobList";

export async function RepairJobResults({
  query,
  moreHref,
}: {
  query: RepairJobFilters;
  moreHref: string;
}) {
  const { items, hasMore } = await getRepairJobs(query);
  const highlightFrom =
    (query.page ?? 0) > 0 ? (query.page ?? 0) * REPAIR_JOBS_PAGE_SIZE : undefined;

  return (
    <div className="flex animate-in flex-col gap-4 fade-in-0 duration-300">
      <RepairJobList items={items} highlightFrom={highlightFrom} />
      {hasMore && <LoadMore href={moreHref} />}
    </div>
  );
}
