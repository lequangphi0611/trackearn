import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/filters/FilterBar";

type Params = {
  status?: string;
  q?: string;
  from?: string;
  to?: string;
};

export function DeviceFilters({ params }: { params: Params }) {
  const activeCount =
    (params.status ? 1 : 0) + (params.from ? 1 : 0) + (params.to ? 1 : 0);

  return (
    <form method="get" action="/devices">
      <FilterBar
        activeCount={activeCount}
        search={
          <Input name="q" defaultValue={params.q ?? ""} placeholder="Tìm tên máy / tình trạng" />
        }
      >
        <Select name="status" defaultValue={params.status ?? ""} className="sm:w-36">
          <option value="">Tất cả</option>
          <option value="in_stock">Còn hàng</option>
          <option value="sold">Đã bán</option>
        </Select>
        <Input type="date" name="from" defaultValue={params.from ?? ""} className="sm:w-40" />
        <Input type="date" name="to" defaultValue={params.to ?? ""} className="sm:w-40" />
        <Button type="submit" variant="outline" size="sm" className="max-sm:h-10">
          Lọc
        </Button>
      </FilterBar>
    </form>
  );
}
