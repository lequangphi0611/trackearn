import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Params = {
  q?: string;
  type?: string;
  status?: string;
  from?: string;
  to?: string;
};

export function TransactionFilters({ line, params }: { line: string; params: Params }) {
  return (
    <form
      method="get"
      action={`/transactions/${line}`}
      className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <Input
        name="q"
        defaultValue={params.q ?? ""}
        placeholder="Tìm ghi chú / đối tác"
        className="sm:w-48"
      />
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
      <Button type="submit" variant="outline" size="sm">
        Lọc
      </Button>
    </form>
  );
}
