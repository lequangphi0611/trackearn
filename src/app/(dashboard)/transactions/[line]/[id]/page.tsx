import { notFound } from "next/navigation";
import Link from "next/link";
import { getTransactionLine } from "@/lib/transaction-lines";
import { getTransactionById } from "@/queries/transactions";
import { getExpenseCategories } from "@/queries/expense-categories";
import { vnDateTimeLocal } from "@/lib/date";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { EditTransactionForm } from "../../components/EditTransactionForm";
import { DeleteTransactionButton } from "../../components/DeleteTransactionButton";
import { StatusBadge } from "../../components/StatusBadge";

const SOURCE_KIND_LABELS: Record<string, string> = {
  device_buy: "Mua thiết bị",
  device_sell: "Bán thiết bị",
};

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ line: string; id: string }>;
}) {
  const { line, id } = await params;
  const config = getTransactionLine(line);
  if (!config) notFound();

  const t = await getTransactionById(id);
  if (!t) notFound();

  const isAuto = t.sourceKind !== "manual";
  const categories = await getExpenseCategories();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-lg font-semibold">Giao dịch — {config.label}</h1>

      <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
        <p>
          Người tạo: {t.userName ?? "—"} · {formatDateTime(t.createdAt)}
        </p>
        {t.updatedById && (
          <p>
            Sửa gần nhất: {t.updatedByName ?? "—"} · {formatDateTime(t.updatedAt)}
          </p>
        )}
      </div>

      {isAuto ? (
        <>
          {/* Số tiền lớn */}
          <div className="rounded-lg border border-border p-4">
            <p className="mb-1 text-xs text-muted-foreground">
              {t.type === "income" ? "Thu nhập" : "Chi phí"}
            </p>
            <p
              className={`text-3xl font-bold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(t.amount)}
            </p>
          </div>

          {/* Metadata */}
          <div className="divide-y divide-border rounded-lg border border-border text-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-muted-foreground">Ngày giao dịch</span>
              <span className="font-medium">{formatDateTime(t.transactedAt)}</span>
            </div>
            {t.categoryName && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-muted-foreground">Danh mục</span>
                <span className="font-medium">{t.categoryName}</span>
              </div>
            )}
            {t.counterpartyName && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-muted-foreground">Đối tác</span>
                <span className="font-medium">{t.counterpartyName}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-muted-foreground">Trạng thái</span>
              <StatusBadge status={t.paymentStatus} />
            </div>
            {t.note && (
              <div className="flex items-start justify-between gap-4 px-4 py-3">
                <span className="shrink-0 text-muted-foreground">Ghi chú</span>
                <span className="text-right font-medium">{t.note}</span>
              </div>
            )}
          </div>

          {/* Nguồn tự động */}
          <Alert>
            <AlertDescription>
              Giao dịch này được tạo tự động từ{" "}
              <span className="font-medium">
                {SOURCE_KIND_LABELS[t.sourceKind ?? ""] ?? "màn nguồn"}
              </span>
              . Mọi chỉnh sửa thực hiện ở màn nguồn.
            </AlertDescription>
          </Alert>

          {(t.sourceKind === "device_buy" || t.sourceKind === "device_sell") && t.sourceId && (
            <Link
              href={`/devices/${t.sourceId}`}
              className={buttonVariants({ variant: "default", className: "w-full justify-center" })}
            >
              Xem thiết bị →
            </Link>
          )}
        </>
      ) : (
        <>
          <EditTransactionForm
            line={line}
            id={t.id}
            type={t.type}
            amount={t.amount}
            categoryId={t.categoryId}
            note={t.note}
            defaultDateTime={vnDateTimeLocal(new Date(t.transactedAt))}
            categories={categories}
            debt={
              t.debtId
                ? {
                    paid: t.debtPaid ?? 0,
                    counterpartyName: t.counterpartyName ?? "",
                    dueDate: t.dueDate,
                  }
                : null
            }
          />
          <div className="flex justify-end">
            <DeleteTransactionButton id={t.id} line={line} />
          </div>
        </>
      )}
    </div>
  );
}
