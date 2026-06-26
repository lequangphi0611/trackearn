import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <Skeleton className="h-6 w-44" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}
