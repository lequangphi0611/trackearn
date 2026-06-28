import { notFound } from "next/navigation";
import { getTransactionLine } from "@/lib/transaction-lines";
import { getTransactionById } from "@/queries/transactions";
import { getExpenseCategories } from "@/queries/expense-categories";
import { vnDateTimeLocal } from "@/lib/date";
import { formatDateTime } from "@/lib/format";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EditTransactionForm } from "../../components/EditTransactionForm";
import { DeleteTransactionButton } from "../../components/DeleteTransactionButton";

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
        <Alert>
          <AlertDescription>
            Giao dịch này sinh tự động từ nguồn ({t.sourceKind}). Mọi chỉnh sửa thực hiện ở
            màn nguồn.
          </AlertDescription>
        </Alert>
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
