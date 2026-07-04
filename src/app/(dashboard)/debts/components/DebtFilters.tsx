import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/filters/FilterBar";

export function DebtFilters({
  dir,
  params,
}: {
  dir: string;
  params: { status?: string; overdue?: boolean; q?: string };
}) {
  const activeCount =
    (params.status && params.status !== "unsettled" ? 1 : 0) + (params.overdue ? 1 : 0);

  return (
    <form method="get" action="/debts">
      <input type="hidden" name="dir" value={dir} />
      <FilterBar
        activeCount={activeCount}
        search={<Input name="q" defaultValue={params.q ?? ""} placeholder="Tìm đối tác" />}
      >
        <Select name="status" defaultValue={params.status ?? "unsettled"} className="sm:w-44">
          <option value="unsettled">Chưa tất toán</option>
          <option value="settled">Đã tất toán</option>
          <option value="all">Tất cả</option>
        </Select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="overdue"
            value="1"
            defaultChecked={params.overdue}
            className="size-4 accent-primary"
          />
          Chỉ quá hạn
        </label>
        <Button type="submit" variant="outline" size="sm" className="max-sm:h-10">
          Lọc
        </Button>
      </FilterBar>
    </form>
  );
}
