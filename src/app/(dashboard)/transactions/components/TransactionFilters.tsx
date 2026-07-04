import Link from "next/link";
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
  // Chỉ đến từ link drill-down báo cáo (reports.md §4.5) — không có ô chọn
  // trong UI, nhưng phải giữ nguyên khi submit form lọc (state.md#url-state).
  categoryId?: string;
  excludeCategoryId?: string;
};

// line = undefined ở view tổng hợp "/transactions" (không có mảng cố định).
export function TransactionFilters({ line, params }: { line?: string; params: Params }) {
  // Đếm filter khác mặc định (khoảng ngày mặc định = tháng hiện tại).
  const range = vnMonthRange();
  const defaultFrom = vnDateOnly(range.from);
  const defaultTo = vnDateOnly(new Date(range.to.getTime() - 1));
  const activeCount =
    (params.type ? 1 : 0) +
    (params.status ? 1 : 0) +
    (params.from !== defaultFrom || params.to !== defaultTo ? 1 : 0) +
    (params.categoryId ? 1 : 0) +
    (params.excludeCategoryId ? 1 : 0);

  // categoryId/excludeCategoryId không có ô chọn trong UI (chỉ đến từ link
  // báo cáo) → không có gợi ý trực quan nào khác cho biết đang lọc theo danh
  // mục; badge activeCount của FilterBar chỉ hiện trên nút icon thu gọn ở
  // mobile (sm:hidden), desktop không có. Thêm dòng thông báo hiện ở MỌI
  // breakpoint để không "lọc ngầm" mà người xem không biết.
  const hasCategoryFilter = Boolean(params.categoryId || params.excludeCategoryId);
  const clearQs = new URLSearchParams();
  if (params.q) clearQs.set("q", params.q);
  if (params.type) clearQs.set("type", params.type);
  if (params.status) clearQs.set("status", params.status);
  if (params.from) clearQs.set("from", params.from);
  if (params.to) clearQs.set("to", params.to);
  const clearHref = `${line ? `/transactions/${line}` : "/transactions"}${
    clearQs.toString() ? `?${clearQs}` : ""
  }`;

  return (
    <form method="get" action={line ? `/transactions/${line}` : "/transactions"}>
      {/* Giữ nguyên filter danh mục đến từ link báo cáo khi submit lại form. */}
      {params.categoryId && (
        <input type="hidden" name="categoryId" value={params.categoryId} />
      )}
      {params.excludeCategoryId && (
        <input type="hidden" name="excludeCategoryId" value={params.excludeCategoryId} />
      )}
      {hasCategoryFilter && (
        <div className="mb-2 flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">
          <span>Đang lọc theo danh mục từ báo cáo</span>
          <Link
            href={clearHref}
            className="ml-auto font-medium text-foreground underline decoration-muted-foreground/40 underline-offset-4 hover:decoration-current"
          >
            Bỏ lọc
          </Link>
        </div>
      )}
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
