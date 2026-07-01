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

  const [categories, devices] = await Promise.all([
    getExpenseCategories(),
    config.hasDevicePicker ? getInStockDevicesForPicker() : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-lg font-semibold">Nhập giao dịch — {config.label}</h1>

      {config.hasDevicePicker ? (
        <DeviceTransactionForm
          line={config.slug}
          devices={devices}
          categories={categories}
          defaultDateTime={vnDateTimeLocal()}
          defaultDate={vnTodayISODate()}
        />
      ) : (
        <TransactionForm
          line={line}
          lockType={config.expenseOnly ? "expense" : undefined}
          defaultDateTime={vnDateTimeLocal()}
          categories={categories}
        />
      )}
    </div>
  );
}
