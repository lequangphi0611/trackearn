import { notFound } from "next/navigation";
import { getSparePartById } from "@/queries/spare-parts";
import { formatCurrency, formatQuantity } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EditSparePartForm } from "../components/EditSparePartForm";
import { RestockDialog } from "../components/RestockDialog";
import { AdjustStockDialog } from "../components/AdjustStockDialog";
import { DeleteSparePartButton } from "../components/DeleteSparePartButton";

export default async function SparePartDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getSparePartById(id);
  if (!p) notFound();

  const q = Number(p.quantity);
  const min = Number(p.minQuantity);
  const warn = q <= min;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-lg font-semibold">{p.name}</h1>

      {/* Tồn & giá vốn */}
      <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tồn hiện tại</span>
          <span className={cn("font-mono font-semibold tabular", warn && "text-expense")}>
            {formatQuantity(p.quantity, p.unit)}
            {q < 0 && <Badge variant="danger" className="ml-2">Tồn âm</Badge>}
            {q === 0 && <Badge variant="danger" className="ml-2">Hết</Badge>}
            {q > 0 && q <= min && <Badge variant="warning" className="ml-2">Sắp hết</Badge>}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Giá vốn (BQGQ)</span>
          <span className="font-mono tabular">{formatCurrency(p.buyPrice)}/{p.unit}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ngưỡng cảnh báo</span>
          <span className="font-mono tabular">{formatQuantity(p.minQuantity, p.unit)}</span>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <RestockDialog id={p.id} unit={p.unit} buyPrice={p.buyPrice} />
        <AdjustStockDialog id={p.id} unit={p.unit} currentQuantity={p.quantity} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Sửa thông tin</h2>
        <EditSparePartForm
          id={p.id}
          name={p.name}
          unit={p.unit}
          minQuantity={p.minQuantity}
        />
      </div>

      <div className="mt-2 flex justify-end border-t border-border pt-3">
        <DeleteSparePartButton id={p.id} />
      </div>
    </div>
  );
}
