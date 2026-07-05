import { Smartphone, Wrench, ClipboardList } from "lucide-react";
import { getInStockSummary } from "@/queries/devices";
import { getLowStockCount } from "@/queries/spare-parts";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { HubCard } from "../components/HubCard";

export default async function KhoPage() {
  const [devices, lowStock] = await Promise.all([getInStockSummary(), getLowStockCount()]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Kho hàng</h1>

      <div className="flex flex-col gap-3">
        <HubCard href="/devices" icon={<Smartphone className="size-5" />} title="Thiết bị điện tử">
          {devices.count} máy còn hàng · Vốn{" "}
          <span className="font-mono tabular">{formatCurrency(devices.capital)}</span>
        </HubCard>

        <HubCard
          href="/spare-parts"
          icon={<Wrench className="size-5" />}
          title="Phụ tùng xe múc"
          badge={lowStock > 0 ? <Badge variant="warning">{lowStock} sắp hết</Badge> : undefined}
        >
          Kho phụ tùng — nhập, kiểm kê, cảnh báo tồn thấp
        </HubCard>

        <HubCard href="/repair-jobs" icon={<ClipboardList className="size-5" />} title="Job sửa xe múc">
          Tạo job, xuất phụ tùng, tính lãi từng job
        </HubCard>
      </div>
    </div>
  );
}
