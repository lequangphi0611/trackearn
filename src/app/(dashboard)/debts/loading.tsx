import { Skeleton } from "@/components/ui/skeleton";
import { DebtListSkeleton, DebtTabsSkeleton } from "./components/DebtSkeletons";

export default function DebtsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-6 w-24" />
      <DebtTabsSkeleton />
      <Skeleton className="h-10 w-full rounded-lg" />
      <DebtListSkeleton />
    </div>
  );
}
