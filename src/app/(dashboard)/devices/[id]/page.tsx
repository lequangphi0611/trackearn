import { notFound } from "next/navigation";
import Link from "next/link";
import { getDeviceById } from "@/queries/devices";
import { vnTodayISODate } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import { Money } from "@/components/Money";
import { Badge } from "@/components/ui/badge";
import { EditDeviceForm } from "../components/EditDeviceForm";
import { SellDeviceDialog } from "../components/SellDeviceDialog";
import { CancelSellDialog } from "../components/CancelSellDialog";

export default async function DeviceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = await getDeviceById(id);
  if (!d) notFound();

  const sold = d.status === "sold";
  const profit = sold && d.sellPrice !== null ? d.sellPrice - d.buyPrice : null;
  const sellPaidPartly = (d.sellDebtPaid ?? 0) > 0;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{d.name}</h1>
        <Badge variant={sold ? "muted" : "success"}>{sold ? "Đã bán" : "Còn hàng"}</Badge>
      </div>

      {/* Tổng quan tài chính máy */}
      <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Giá mua</span>
          <span className="font-mono tabular">{formatCurrency(d.buyPrice)}</span>
        </div>
        {sold && d.sellPrice !== null && (
          <>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Giá bán</span>
              <span className="font-mono tabular">{formatCurrency(d.sellPrice)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1.5">
              <span className="text-muted-foreground">Lãi</span>
              {profit !== null && (
                <Money
                  amount={Math.abs(profit)}
                  tone={profit >= 0 ? "income" : "expense"}
                  signed
                  className="font-semibold"
                />
              )}
            </div>
          </>
        )}
        <div className="mt-1 flex flex-col gap-1 border-t border-border pt-1.5 text-xs text-muted-foreground">
          {d.buyTransactionId && (
            <Link href={`/transactions/thiet-bi/${d.buyTransactionId}`} className="underline">
              Giao dịch mua →
            </Link>
          )}
          {d.sellTransactionId && (
            <Link href={`/transactions/thiet-bi/${d.sellTransactionId}`} className="underline">
              Giao dịch bán →
            </Link>
          )}
        </div>
      </div>

      {/* Bán ra / Hủy bán */}
      {!sold ? (
        <div className="flex justify-end">
          <SellDeviceDialog id={d.id} defaultDate={vnTodayISODate()} />
        </div>
      ) : (
        <div className="flex flex-col items-end gap-1">
          <CancelSellDialog id={d.id} blocked={sellPaidPartly} />
          {sellPaidPartly && (
            <p className="text-xs text-muted-foreground">
              Không thể hủy bán: công nợ bán đã thu một phần. Xử lý công nợ trước.
            </p>
          )}
        </div>
      )}

      {/* Sửa thông tin */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Sửa thông tin</h2>
        <EditDeviceForm
          id={d.id}
          sold={sold}
          name={d.name}
          conditionNote={d.conditionNote}
          buyPrice={d.buyPrice}
          buyDate={d.buyDate}
          buyFrom={d.buyFrom}
          buyDebtPaid={d.buyDebtPaid}
        />
        {sold && (
          <p className="text-xs text-muted-foreground">
            Máy đã bán chỉ sửa được tên và tình trạng. Đổi giá/ngày qua hủy bán rồi bán lại.
          </p>
        )}
      </div>
    </div>
  );
}
