import { Skeleton } from "@/components/ui/skeleton";
import { SparePartListSkeleton } from "./components/SparePartListSkeleton";

export default function SparePartsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <SparePartListSkeleton />
    </div>
  );
}
