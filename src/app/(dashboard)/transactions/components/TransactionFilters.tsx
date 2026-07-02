import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/filters/FilterBar";
import { vnDateOnly, vnMonthRange } from "@/lib/date";

type Params = {
  q?: string;
  type?: string;
  status?: string;
  from?: string;
  to?: string;
};

export function TransactionFilters({ line, params }: { line: string; params: Params }) {
  // Đếm filter khác mặc định (khoảng ngày mặc định = tháng hiện tại).
  const range = vnMonthRange();
  const defaultFrom = vnDateOnly(range.from);
  const defaultTo = vnDateOnly(new Date(range.to.getTime() - 1));
  const activeCount =
    (params.type ? 1 : 0) +
    (params.status ? 1 : 0) +
    (params.from !== defaultFrom || params.to !== defaultTo ? 1 : 0);

  return (
    <form method="get" action={`/transactions/${line}`}>
      <FilterBar
        activeCount={activeCount}
        search={
          <Input name="q" defaultValue={params.q ?? ""} placeholder="Tìm ghi chú / đối tác" />
        }
      >
        <Select name="type" defaultValue={params.type ?? ""} className="sm:w-32">
          <option value="">Tất cả loại</option>
          <option value="income">Thu</option>
          <option value="expense">Chi</option>
        </Select>
        <Select name="status" defaultValue={params.status ?? ""} className="sm:w-36">
          <option value="">Mọi trạng thái</option>
          <option value="paid">Đủ</option>
          <option value="partial">Một phần</option>
          <option value="pending">Chưa</option>
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
