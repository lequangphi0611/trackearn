import { notFound } from "next/navigation";
import { getTransactionLine } from "@/lib/transaction-lines";
import { getExpenseCategories } from "@/queries/expense-categories";
import { getInStockDevicesForPicker } from "@/queries/devices";
import { vnDateTimeLocal, vnTodayISODate } from "@/lib/date";
import { RepairJobHubCard } from "../../../components/RepairJobHubCard";
import { TransactionForm } from "../../components/TransactionForm";
import { DeviceTransactionForm } from "../../components/DeviceTransactionForm";
import { MODES, type DeviceTransactionMode } from "../../components/device-transaction-modes";

function parseMode(v: string | undefined): DeviceTransactionMode | undefined {
  return MODES.some((m) => m.key === v) ? (v as DeviceTransactionMode) : undefined;
}

export default async function NewTransactionPage({
  params,
  searchParams,
}: {
  params: Promise<{ line: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { line } = await params;
  const config = getTransactionLine(line);
  if (!config) notFound();

  const sp = await searchParams;
  const defaultMode = parseMode(sp.mode);

  const [categories, devices] = await Promise.all([
    getExpenseCategories(),
    config.hasDevicePicker ? getInStockDevicesForPicker() : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-lg font-semibold">Nhập giao dịch — {config.label}</h1>

      {config.hasDevicePicker ? (
        // key={defaultMode}: 2 HubCard trên /devices cùng dẫn về route này,
        // chỉ khác ?mode= — force remount khi mode đổi để state mode không
        // bị App Router giữ lại từ lần điều hướng trước (giống QuickEntryDialog).
        <DeviceTransactionForm
          key={defaultMode}
          line={config.slug}
          devices={devices}
          categories={categories}
          defaultDateTime={vnDateTimeLocal()}
          defaultDate={vnTodayISODate()}
          defaultMode={defaultMode}
        />
      ) : (
        <>
          {/* Cảnh báo chéo mềm (issue #12 round 2): trang này chỉ ghi thu/chi
              trực tiếp, KHÔNG trừ kho — nhắc lối job trước khi nhập, phòng
              trường hợp vào thẳng URL này (bookmark, gõ tay) bỏ qua hub. */}
          {config.repairJobHref && <RepairJobHubCard />}
          <TransactionForm
            line={line}
            lockType={config.expenseOnly ? "expense" : undefined}
            defaultDateTime={vnDateTimeLocal()}
            categories={categories}
          />
        </>
      )}
    </div>
  );
}
