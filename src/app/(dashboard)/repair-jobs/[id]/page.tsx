import { notFound } from "next/navigation";
import Link from "next/link";
import { getRepairJobById } from "@/queries/repair-jobs";
import { getSparePartsForPicker } from "@/queries/spare-parts";
import { formatCurrency, formatDate, formatQuantity } from "@/lib/format";
import { Money } from "@/components/Money";
import { StatusBadge } from "../../transactions/components/StatusBadge";
import { EditJobForm } from "../components/EditJobForm";
import { DeleteJobButton } from "../components/DeleteJobButton";
import type { LineDraft } from "../components/JobLinesEditor";

export default async function RepairJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getRepairJobById(id);
  if (!data) notFound();
  const { job, parts, profit } = data;
  const parallelParts = await getSparePartsForPicker();

  const initialLines: LineDraft[] = parts.map((p) => ({
    sparePartId: p.sparePartId,
    quantity: p.quantity,
    unitPrice: String(p.unitPrice),
  }));

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{job.customerName}</h1>
        <StatusBadge status={job.paymentStatus ?? "paid"} />
      </div>

      {/* Tổng quan: phụ tùng + công + tổng + lãi */}
      <div className="flex flex-col gap-2 rounded-lg border border-border p-3 text-sm">
        <div className="text-xs text-muted-foreground">{job.jobDate && formatDate(job.jobDate)}</div>
        {parts.length > 0 && (
          <ul className="flex flex-col gap-1 border-b border-border pb-2">
            {parts.map((p) => (
              <li key={p.id} className="flex justify-between gap-2">
                <span className="min-w-0 truncate">
                  {p.name} × {formatQuantity(p.quantity, p.unit)}
                </span>
                <span className="font-mono tabular">
                  {formatCurrency(Math.round(Number(p.quantity) * p.unitPrice))}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tiền công</span>
          <span className="font-mono tabular">{formatCurrency(job.laborFee)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-1.5 font-medium">
          <span>Tổng</span>
          <span className="font-mono tabular">{formatCurrency(job.total ?? 0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Lãi (công + chênh phụ tùng)</span>
          <Money amount={Math.abs(profit)} tone={profit >= 0 ? "income" : "expense"} signed className="font-semibold" />
        </div>
        {job.transactionId && (
          <Link href={`/transactions/xe-muc/${job.transactionId}`} className="mt-1 text-xs text-muted-foreground underline">
            Giao dịch thu →
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Sửa job</h2>
        <EditJobForm
          id={job.id}
          parts={parallelParts}
          customerName={job.customerName}
          jobDate={job.jobDate ?? ""}
          laborFee={job.laborFee}
          note={job.note}
          initialLines={initialLines}
        />
      </div>

      <div className="mt-2 flex justify-end border-t border-border pt-3">
        <DeleteJobButton id={job.id} />
      </div>
    </div>
  );
}
