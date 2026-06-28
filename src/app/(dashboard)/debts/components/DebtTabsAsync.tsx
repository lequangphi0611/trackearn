import { getDebtRemainingTotal } from "@/queries/debts";
import { DebtTabs } from "./DebtTabs";

// Tổng còn lại 2 chiều — tách riêng để stream (không chặn khung trang).
export async function DebtTabsAsync({ dir }: { dir: string }) {
  const [receivableTotal, payableTotal] = await Promise.all([
    getDebtRemainingTotal("receivable"),
    getDebtRemainingTotal("payable"),
  ]);
  return (
    <div className="animate-in fade-in-0 duration-300">
      <DebtTabs dir={dir} receivableTotal={receivableTotal} payableTotal={payableTotal} />
    </div>
  );
}
