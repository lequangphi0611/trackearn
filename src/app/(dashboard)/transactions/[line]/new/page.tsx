import { notFound } from "next/navigation";
import { getTransactionLine } from "@/lib/transaction-lines";
import { getExpenseCategories } from "@/queries/expense-categories";
import { getInStockDevicesForPicker } from "@/queries/devices";
import { vnDateTimeLocal, vnTodayISODate } from "@/lib/date";
import { TransactionForm } from "../../components/TransactionForm";
import { DeviceTransactionForm } from "../../components/DeviceTransactionForm";

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

      {line === "thiet-bi" ? (
        <DeviceTransactionFormContainer categories={categories} />
      ) : (
        <TransactionForm
          line={line}
          expenseOnly={config.expenseOnly}
          defaultDateTime={vnDateTimeLocal()}
          categories={categories}
        />
      )}
    </div>
  );
}

async function DeviceTransactionFormContainer({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const devices = await getInStockDevicesForPicker();
  return (
    <DeviceTransactionForm
      devices={devices}
      categories={categories}
      defaultDateTime={vnDateTimeLocal()}
      defaultDate={vnTodayISODate()}
    />
  );
}
