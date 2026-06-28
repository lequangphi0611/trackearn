import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function DebtFilters({
  dir,
  params,
}: {
  dir: string;
  params: { status?: string; overdue?: boolean; q?: string };
}) {
  return (
    <form
      method="get"
      action="/debts"
      className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <input type="hidden" name="dir" value={dir} />
      <Input
        name="q"
        defaultValue={params.q ?? ""}
        placeholder="Tìm đối tác"
        className="sm:w-48"
      />
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
      <Button type="submit" variant="outline" size="sm">
        Lọc
      </Button>
    </form>
  );
}
