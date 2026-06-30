import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTransactionLine } from "@/lib/transaction-lines";
import { getExpenseCategories } from "@/queries/expense-categories";
import { vnDateTimeLocal } from "@/lib/date";
import { TransactionForm } from "../../components/TransactionForm";

export default async function NewTransactionPage({
  params,
}: {
  params: Promise<{ line: string }>;
}) {
  const { line } = await params;
  const config = getTransactionLine(line);
  if (!config) notFound();

  const categories = await getExpenseCategories();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-lg font-semibold">Nhập giao dịch — {config.label}</h1>

      {/* Bán máy nên gắn với máy trong kho (để tính lãi theo máy), không ghi như
          giao dịch Thu rời. Quick-entry "gắn máy" đầy đủ sẽ có ở dashboard. */}
      {line === "thiet-bi" && (
        <Link
          href="/devices"
          className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/60"
        >
          <span className="flex-1">
            Bán máy trong kho? Mở <span className="font-medium text-foreground">Kho thiết bị</span>{" "}
            để gắn lãi theo máy.
          </span>
          <ArrowRight className="size-4 shrink-0" />
        </Link>
      )}

      <TransactionForm
        line={line}
        expenseOnly={config.expenseOnly}
        defaultDateTime={vnDateTimeLocal()}
        categories={categories}
      />
    </div>
  );
}
