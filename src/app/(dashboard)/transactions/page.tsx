import Link from "next/link";
import { TRANSACTION_LINES } from "@/lib/transaction-lines";

export default function TransactionsIndexPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Giao dịch</h1>
      <div className="grid gap-2 sm:grid-cols-2">
        {TRANSACTION_LINES.map((l) => (
          <Link
            key={l.slug}
            href={`/transactions/${l.slug}`}
            className="rounded-lg border border-border p-4 text-sm font-medium transition-colors hover:bg-muted/50"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
