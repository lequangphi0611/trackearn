import { Skeleton } from "@/components/ui/skeleton";
import { RepairJobListSkeleton } from "./components/RepairJobListSkeleton";

export default function RepairJobsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <RepairJobListSkeleton />
    </div>
  );
}
