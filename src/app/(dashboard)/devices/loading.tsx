import { Skeleton } from "@/components/ui/skeleton";
import { DeviceListSkeleton } from "./components/DeviceListSkeleton";

export default function DevicesLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <DeviceListSkeleton />
    </div>
  );
}
