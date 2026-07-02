import { cn } from "@/lib/utils";
import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { RepairJobFilters } from "@/queries/repair-jobs";
import type { PaymentStatus } from "@/lib/payment";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/filters/FilterBar";
import { RepairJobResults } from "./components/RepairJobResults";
import { RepairJobListSkeleton } from "./components/RepairJobListSkeleton";

type SearchParams = { from?: string; to?: string; status?: string; q?: string; page?: string };

export default async function RepairJobsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(0, Math.trunc(Number(sp.page) || 0));
  const status =
    sp.status === "paid" || sp.status === "partial" || sp.status === "pending"
      ? (sp.status as PaymentStatus)
      : undefined;

  const query: RepairJobFilters = {
    from: sp.from?.trim() || undefined,
    to: sp.to?.trim() || undefined,
    status,
    q: sp.q?.trim() || undefined,
    page,
  };

  const moreParams = new URLSearchParams();
  if (sp.q) moreParams.set("q", sp.q);
  if (sp.status) moreParams.set("status", sp.status);
  if (sp.from) moreParams.set("from", sp.from);
  if (sp.to) moreParams.set("to", sp.to);
  moreParams.set("page", String(page + 1));

  const filterKey = `${sp.from ?? ""}|${sp.to ?? ""}|${status ?? ""}|${sp.q ?? ""}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Job sửa xe múc</h1>
        <Link href="/repair-jobs/new" className={cn(buttonVariants({ size: "sm" }), "max-sm:h-10")}>
          <Plus />
          Tạo job
        </Link>
      </div>

      <form method="get" action="/repair-jobs">
        <FilterBar
          activeCount={(status ? 1 : 0) + (sp.from ? 1 : 0) + (sp.to ? 1 : 0)}
          search={<Input name="q" defaultValue={sp.q ?? ""} placeholder="Tìm tên khách" />}
        >
          <Select name="status" defaultValue={sp.status ?? ""} className="sm:w-36">
            <option value="">Mọi trạng thái</option>
            <option value="paid">Đủ</option>
            <option value="partial">Một phần</option>
            <option value="pending">Chưa</option>
          </Select>
          <Input type="date" name="from" defaultValue={sp.from ?? ""} className="sm:w-40" />
          <Input type="date" name="to" defaultValue={sp.to ?? ""} className="sm:w-40" />
          <Button type="submit" variant="outline" size="sm" className="max-sm:h-10">
            Lọc
          </Button>
        </FilterBar>
      </form>

      <Suspense key={filterKey} fallback={<RepairJobListSkeleton />}>
        <RepairJobResults query={query} moreHref={`/repair-jobs?${moreParams}`} />
      </Suspense>
    </div>
  );
}
