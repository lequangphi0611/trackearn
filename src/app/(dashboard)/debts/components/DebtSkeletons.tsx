import { Skeleton } from "@/components/ui/skeleton";

export function DebtTabsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2" aria-hidden>
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col items-center gap-2 rounded-lg border border-border p-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-28" />
        </div>
      ))}
    </div>
  );
}

export function DebtListSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="mt-2 h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}
