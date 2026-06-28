import { notFound } from "next/navigation";
import Link from "next/link";
import { getDebtById } from "@/queries/debts";
import { formatDate, formatDateTime } from "@/lib/format";
import { isOverdue, vnTodayISODate } from "@/lib/date";
import { businessLineLabel } from "@/lib/constants";
import { getLineByBusinessLine } from "@/lib/transaction-lines";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/Money";
import { RecordPaymentDialog } from "../components/RecordPaymentDialog";
import { EditDebtForm } from "../components/EditDebtForm";

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}

export default async function DebtDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = await getDebtById(id);
  if (!d) notFound();

  const remaining = d.total - d.paid;
  const overdue = isOverdue(d.dueDate, d.settledAt);
  const lineLabel = businessLineLabel(d.businessLine);
  const dirLabel = d.direction === "receivable" ? "Khách nợ mình" : "Mình nợ";
  const sourceLine = getLineByBusinessLine(d.businessLine);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-lg font-semibold">Công nợ — {dirLabel}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span>{d.counterpartyName}</span>
            <div className="flex gap-1">
              {d.settledAt ? (
                <Badge variant="success">Đã tất toán</Badge>
              ) : overdue ? (
                <Badge variant="danger">Quá hạn</Badge>
              ) : null}
              <Badge variant="muted">{lineLabel}</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Row label="Tổng">
            <Money amount={d.total} />
          </Row>
          <Row label="Đã trả">
            <Money amount={d.paid} />
          </Row>
          <Row label="Còn lại">
            <Money
              amount={remaining}
              tone={d.direction === "receivable" ? "income" : "expense"}
              className="text-base font-semibold"
            />
          </Row>
          {d.dueDate && <Row label="Hẹn trả">{formatDate(d.dueDate)}</Row>}
          {d.settledAt && <Row label="Tất toán">{formatDateTime(d.settledAt)}</Row>}
        </CardContent>
      </Card>

      {!d.settledAt && (
        <RecordPaymentDialog debtId={d.id} remaining={remaining} defaultDate={vnTodayISODate()} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Đính chính</CardTitle>
        </CardHeader>
        <CardContent>
          <EditDebtForm
            debtId={d.id}
            counterpartyName={d.counterpartyName}
            dueDate={d.dueDate}
          />
        </CardContent>
      </Card>

      {sourceLine && (
        <Link
          href={`/transactions/${sourceLine.slug}/${d.transactionId}`}
          className="text-sm text-primary hover:underline"
        >
          Xem giao dịch gốc →
        </Link>
      )}
    </div>
  );
}
