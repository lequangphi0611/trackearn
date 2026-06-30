import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Params = {
  status?: string;
  q?: string;
  from?: string;
  to?: string;
};

export function DeviceFilters({ params }: { params: Params }) {
  return (
    <form
      method="get"
      action="/devices"
      className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <Input
        name="q"
        defaultValue={params.q ?? ""}
        placeholder="Tìm tên máy / tình trạng"
        className="sm:w-48"
      />
      <Select name="status" defaultValue={params.status ?? ""} className="sm:w-36">
        <option value="">Tất cả</option>
        <option value="in_stock">Còn hàng</option>
        <option value="sold">Đã bán</option>
      </Select>
      <Input type="date" name="from" defaultValue={params.from ?? ""} className="sm:w-40" />
      <Input type="date" name="to" defaultValue={params.to ?? ""} className="sm:w-40" />
      <Button type="submit" variant="outline" size="sm">
        Lọc
      </Button>
    </form>
  );
}
