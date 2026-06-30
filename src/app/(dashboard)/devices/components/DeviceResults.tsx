import { getDevices, DEVICES_PAGE_SIZE, type DeviceFilters } from "@/queries/devices";
import { LoadMore } from "@/components/LoadMore";
import { DeviceList } from "./DeviceList";

// Phần phụ thuộc DB tách riêng để stream trong <Suspense> (khung trang hiện ngay).
export async function DeviceResults({
  query,
  moreHref,
}: {
  query: DeviceFilters;
  moreHref: string;
}) {
  const { items, hasMore } = await getDevices(query);
  const highlightFrom =
    (query.page ?? 0) > 0 ? (query.page ?? 0) * DEVICES_PAGE_SIZE : undefined;

  return (
    <div className="flex animate-in flex-col gap-4 fade-in-0 duration-300">
      <DeviceList items={items} highlightFrom={highlightFrom} />
      {hasMore && <LoadMore href={moreHref} />}
    </div>
  );
}
