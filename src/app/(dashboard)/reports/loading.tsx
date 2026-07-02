import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-10 w-52" />
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-64 w-full rounded-xl" />
      ))}
    </div>
  );
}
