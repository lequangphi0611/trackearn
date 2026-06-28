import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-9 w-28 self-end" />
      {[0, 1].map((i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}
