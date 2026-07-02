import { cn } from "@/lib/utils";
import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { SparePartFilters } from "@/queries/spare-parts";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SparePartResults } from "./components/SparePartResults";
import { SparePartListSkeleton } from "./components/SparePartListSkeleton";

type SearchParams = { q?: string; low?: string; page?: string };

export default async function SparePartsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(0, Math.trunc(Number(sp.page) || 0));
  const lowOnly = sp.low === "1";

  const query: SparePartFilters = { q: sp.q?.trim() || undefined, lowOnly, page };

  const moreParams = new URLSearchParams();
  if (sp.q) moreParams.set("q", sp.q);
  if (lowOnly) moreParams.set("low", "1");
  moreParams.set("page", String(page + 1));

  const filterKey = `${sp.q ?? ""}|${lowOnly ? "low" : ""}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Kho phụ tùng</h1>
        <Link href="/spare-parts/new" className={cn(buttonVariants({ size: "sm" }), "max-sm:h-10")}>
          <Plus />
          Nhập phụ tùng
        </Link>
      </div>

      <form method="get" action="/spare-parts" className="flex flex-wrap items-center gap-2">
        <Input name="q" defaultValue={sp.q ?? ""} placeholder="Tìm tên phụ tùng" className="sm:w-56" />
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <input type="checkbox" name="low" value="1" defaultChecked={lowOnly} className="size-4 accent-primary" />
          Chỉ tồn thấp
        </label>
        <Button type="submit" variant="outline" size="sm">
          Lọc
        </Button>
      </form>

      <Suspense key={filterKey} fallback={<SparePartListSkeleton />}>
        <SparePartResults query={query} moreHref={`/spare-parts?${moreParams}`} />
      </Suspense>
    </div>
  );
}
