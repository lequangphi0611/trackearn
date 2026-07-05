import { Skeleton } from "@/components/ui/skeleton";
import { TransactionListSkeleton } from "./components/TransactionListSkeleton";

export default function TransactionsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-9 w-full rounded-lg" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <TransactionListSkeleton />
    </div>
  );
}
