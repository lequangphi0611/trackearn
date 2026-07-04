import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-9 w-48" />
      </div>
      <Skeleton className="h-10 w-full" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-40 w-full rounded-xl" />
      ))}
    </div>
  );
}
