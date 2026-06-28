import { notFound } from "next/navigation";
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
      <TransactionForm
        line={line}
        expenseOnly={config.expenseOnly}
        defaultDateTime={vnDateTimeLocal()}
        categories={categories}
      />
    </div>
  );
}
