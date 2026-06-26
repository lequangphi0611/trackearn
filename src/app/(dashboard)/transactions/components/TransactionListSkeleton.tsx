import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Khung "dòng sổ" lúc tải lần đầu — cùng hình dáng với danh sách thật để
// không bị nhảy layout khi nội dung tới.
export function TransactionListSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden>
      {[0, 1].map((s) => (
        <section key={s} className="flex flex-col">
          <div className="flex items-baseline justify-between px-1 pb-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            {[0, 1, 2].map((r) => (
              <div
                key={r}
                className={cn(
                  "flex items-center gap-3 border-l-2 border-l-muted py-3 pr-3 pl-3",
                  r > 0 && "border-t border-t-border/70",
                )}
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
