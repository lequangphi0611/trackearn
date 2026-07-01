import { and, desc, eq, gte, ilike, lte, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { debts, repairJobParts, repairJobs, spareParts, transactions } from "@/db/schema";
import type { PaymentStatus } from "@/lib/payment";

export const REPAIR_JOBS_PAGE_SIZE = 20;
const MAX_PAGE = 50;

export type RepairJobFilters = {
  from?: string; // job_date >=
  to?: string; // job_date <=
  status?: PaymentStatus;
  q?: string; // tìm theo tên khách
  page?: number;
};

/** Danh sách job + tổng/trạng thái (join transaction), lọc + load-more. */
export async function getRepairJobs(f: RepairJobFilters) {
  const page = Math.min(f.page ?? 0, MAX_PAGE);
  const take = (page + 1) * REPAIR_JOBS_PAGE_SIZE;
  const conds: SQL[] = [];
  if (f.from) conds.push(gte(repairJobs.jobDate, f.from));
  if (f.to) conds.push(lte(repairJobs.jobDate, f.to));
  if (f.status) conds.push(eq(transactions.paymentStatus, f.status));
  if (f.q) conds.push(ilike(repairJobs.customerName, `%${f.q}%`));

  const rows = await db
    .select({
      id: repairJobs.id,
      customerName: repairJobs.customerName,
      jobDate: repairJobs.jobDate,
      laborFee: repairJobs.laborFee,
      total: transactions.amount,
      paidAmount: transactions.paidAmount,
      paymentStatus: transactions.paymentStatus,
    })
    .from(repairJobs)
    .leftJoin(transactions, eq(transactions.id, repairJobs.transactionId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(repairJobs.jobDate), desc(repairJobs.id))
    .limit(take + 1);

  const hasMore = rows.length > take;
  return { items: hasMore ? rows.slice(0, take) : rows, hasMore };
}

export type RepairJobPartRow = {
  id: string;
  sparePartId: string;
  name: string;
  unit: string;
  quantity: string;
  unitPrice: number;
  costPrice: number;
};

/** Chi tiết job + dòng phụ tùng + transaction + công nợ + lãi. */
export async function getRepairJobById(id: string) {
  const [job] = await db
    .select({
      id: repairJobs.id,
      customerName: repairJobs.customerName,
      laborFee: repairJobs.laborFee,
      note: repairJobs.note,
      jobDate: repairJobs.jobDate,
      transactionId: repairJobs.transactionId,
      total: transactions.amount,
      paidAmount: transactions.paidAmount,
      paymentStatus: transactions.paymentStatus,
      debtId: debts.id,
      debtPaid: debts.paid,
      counterpartyName: debts.counterpartyName,
      dueDate: debts.dueDate,
    })
    .from(repairJobs)
    .leftJoin(transactions, eq(transactions.id, repairJobs.transactionId))
    .leftJoin(debts, eq(debts.transactionId, repairJobs.transactionId))
    .where(eq(repairJobs.id, id))
    .limit(1);
  if (!job) return null;

  const parts: RepairJobPartRow[] = await db
    .select({
      id: repairJobParts.id,
      sparePartId: repairJobParts.sparePartId,
      name: spareParts.name,
      unit: spareParts.unit,
      quantity: repairJobParts.quantity,
      unitPrice: repairJobParts.unitPrice,
      costPrice: repairJobParts.costPrice,
    })
    .from(repairJobParts)
    .leftJoin(spareParts, eq(spareParts.id, repairJobParts.sparePartId))
    .where(eq(repairJobParts.jobId, id))
    .then((rows) =>
      rows.map((r) => ({
        id: r.id,
        sparePartId: r.sparePartId,
        name: r.name ?? "(đã xoá)",
        unit: r.unit ?? "",
        quantity: r.quantity,
        unitPrice: r.unitPrice,
        costPrice: r.costPrice,
      })),
    );

  const cost = parts.reduce((s, p) => s + Number(p.quantity) * p.costPrice, 0);
  const profit = (job.total ?? 0) - Math.round(cost);

  return { job, parts, profit };
}
