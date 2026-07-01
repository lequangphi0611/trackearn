"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { debts, repairJobParts, repairJobs, spareParts, transactions } from "@/db/schema";
import { getCurrentSession } from "@/queries/session";
import { withActionContext } from "@/lib/action-context";
import { setUserId } from "@/lib/request-context";
import { logError, logWarn } from "@/lib/logger";
import { ErrorCode, type ActionError, type ActionResult } from "@/lib/types";
import { derivePaymentStatus } from "@/lib/payment";
import { vnLocalToInstant } from "@/lib/date";
import { zodActionError } from "@/lib/form";
import {
  createRepairJobSchema,
  deleteRepairJobSchema,
  updateRepairJobSchema,
  type JobLine,
} from "./schema";

const BUSINESS_LINE = "xe_muc";
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function authError(): ActionError {
  return { success: false, code: ErrorCode.AUTH_ERROR, error: "Chưa đăng nhập." };
}

function dateToInstant(d: string): Date {
  return vnLocalToInstant(`${d}T12:00`);
}

/** Tổng tiền phụ tùng = Σ round(qty × unit_price) (đồng). */
function partsTotal(lines: JobLine[]): number {
  return lines.reduce((s, l) => s + Math.round(l.quantity * l.unitPrice), 0);
}

/** Khóa các phụ tùng (FOR UPDATE, theo thứ tự id) → map id → {buyPrice, quantity}. */
async function lockParts(tx: Tx, ids: string[]) {
  if (ids.length === 0) return new Map<string, { buyPrice: number; quantity: number }>();
  const sorted = [...new Set(ids)].sort();
  const rows = await tx
    .select({ id: spareParts.id, buyPrice: spareParts.buyPrice, quantity: spareParts.quantity })
    .from(spareParts)
    .where(inArray(spareParts.id, sorted))
    .for("update");
  return new Map(rows.map((r) => [r.id, { buyPrice: r.buyPrice, quantity: Number(r.quantity) }]));
}

/** Cộng dồn số lượng theo từng phụ tùng (gộp dòng trùng). */
function qtyByPart(lines: JobLine[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of lines) m.set(l.sparePartId, (m.get(l.sparePartId) ?? 0) + l.quantity);
  return m;
}

async function setStock(tx: Tx, id: string, qty: number) {
  await tx.update(spareParts).set({ quantity: String(qty) }).where(eq(spareParts.id, id));
}

export const createRepairJob = withActionContext(
  "createRepairJob",
  async (
    _prev: ActionResult<{ id: string }> | null,
    formData: FormData,
  ): Promise<ActionResult<{ id: string }>> => {
    const session = await getCurrentSession();
    if (!session) return authError();
    setUserId(session.user.id);

    const parsed = createRepairJobSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodActionError(parsed.error);
    const d = parsed.data;

    const total = partsTotal(d.lines) + d.laborFee;
    if (total <= 0)
      return { success: false, code: ErrorCode.VALIDATION_ERROR, error: "Job phải có phụ tùng hoặc tiền công." };
    if (d.paidAmount > total)
      return { success: false, code: ErrorCode.VALIDATION_ERROR, error: "Đã thu không được vượt tổng." };
    if (d.paidAmount < total && !d.counterpartyName?.trim())
      return { success: false, code: ErrorCode.VALIDATION_ERROR, error: "Nhập tên khách khi trả sau." };

    try {
      const id = await db.transaction(async (tx) => {
        const partMap = await lockParts(tx, d.lines.map((l) => l.sparePartId));
        for (const l of d.lines)
          if (!partMap.has(l.sparePartId)) throw new Error(`Phụ tùng không tồn tại: ${l.sparePartId}`);

        const [job] = await tx
          .insert(repairJobs)
          .values({
            customerName: d.customerName,
            laborFee: d.laborFee,
            note: d.note?.trim() || null,
            jobDate: d.jobDate,
          })
          .returning({ id: repairJobs.id });

        const paymentStatus = derivePaymentStatus(d.paidAmount, total);
        const [txn] = await tx
          .insert(transactions)
          .values({
            type: "income",
            amount: total,
            paidAmount: d.paidAmount,
            paymentStatus,
            businessLine: BUSINESS_LINE,
            userId: session.user.id,
            sourceKind: "repair_job",
            sourceId: job.id,
            note: `Sửa xe: ${d.customerName}`,
            transactedAt: dateToInstant(d.jobDate),
          })
          .returning({ id: transactions.id });

        await tx.update(repairJobs).set({ transactionId: txn.id }).where(eq(repairJobs.id, job.id));

        // Chụp cost_price = giá vốn hiện tại; trừ tồn (cho âm).
        for (const l of d.lines) {
          await tx.insert(repairJobParts).values({
            jobId: job.id,
            sparePartId: l.sparePartId,
            quantity: String(l.quantity),
            unitPrice: l.unitPrice,
            costPrice: partMap.get(l.sparePartId)!.buyPrice,
          });
        }
        for (const [partId, used] of qtyByPart(d.lines))
          await setStock(tx, partId, partMap.get(partId)!.quantity - used);

        if (d.paidAmount < total) {
          await tx.insert(debts).values({
            transactionId: txn.id,
            direction: "receivable",
            counterpartyName: d.counterpartyName!.trim(),
            total,
            paid: d.paidAmount,
            dueDate: d.dueDate?.trim() || null,
          });
        }
        return job.id;
      });

      revalidatePath("/");
      revalidatePath("/repair-jobs");
      revalidatePath("/spare-parts");
      revalidatePath("/transactions/xe-muc");
      revalidatePath("/debts");
      return { success: true, data: { id } };
    } catch (err) {
      logError("createRepairJob", err, { input: { customer: d.customerName } });
      return { success: false, code: ErrorCode.INTERNAL_ERROR, error: "Không thể tạo job, thử lại." };
    }
  },
);

export const updateRepairJob = withActionContext(
  "updateRepairJob",
  async (_prev: ActionResult | null, formData: FormData): Promise<ActionResult> => {
    const session = await getCurrentSession();
    if (!session) return authError();
    setUserId(session.user.id);

    const parsed = updateRepairJobSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodActionError(parsed.error);
    const d = parsed.data;

    const total = partsTotal(d.lines) + d.laborFee;
    if (total <= 0)
      return { success: false, code: ErrorCode.VALIDATION_ERROR, error: "Job phải có phụ tùng hoặc tiền công." };

    try {
      const result = await db.transaction(async (tx) => {
        const [job] = await tx
          .select()
          .from(repairJobs)
          .where(eq(repairJobs.id, d.id))
          .for("update")
          .limit(1);
        if (!job || !job.transactionId)
          return { ok: false as const, code: ErrorCode.NOT_FOUND, error: "Không tìm thấy job." };

        const [txn] = await tx
          .select()
          .from(transactions)
          .where(eq(transactions.id, job.transactionId))
          .for("update")
          .limit(1);
        const [debt] = await tx
          .select()
          .from(debts)
          .where(eq(debts.transactionId, job.transactionId))
          .for("update")
          .limit(1);

        const oldParts = await tx
          .select()
          .from(repairJobParts)
          .where(eq(repairJobParts.jobId, d.id));

        // Khóa tồn của cả phụ tùng cũ và mới (đối chiếu tồn).
        const ids = [...oldParts.map((p) => p.sparePartId), ...d.lines.map((l) => l.sparePartId)];
        const partMap = await lockParts(tx, ids);
        for (const l of d.lines)
          if (!partMap.has(l.sparePartId)) throw new Error(`Phụ tùng không tồn tại: ${l.sparePartId}`);

        // Hoàn tồn dòng cũ, xoá dòng cũ.
        for (const p of oldParts) {
          const cur = partMap.get(p.sparePartId);
          if (cur) cur.quantity += Number(p.quantity);
        }
        await tx.delete(repairJobParts).where(eq(repairJobParts.jobId, d.id));

        // Xuất lại theo dòng mới (chụp giá vốn hiện tại) + trừ tồn.
        for (const l of d.lines) {
          await tx.insert(repairJobParts).values({
            jobId: d.id,
            sparePartId: l.sparePartId,
            quantity: String(l.quantity),
            unitPrice: l.unitPrice,
            costPrice: partMap.get(l.sparePartId)!.buyPrice,
          });
        }
        for (const [partId, used] of qtyByPart(d.lines)) {
          const cur = partMap.get(partId)!;
          cur.quantity -= used;
        }
        for (const [partId, cur] of partMap) await setStock(tx, partId, cur.quantity);

        await tx
          .update(repairJobs)
          .set({
            customerName: d.customerName,
            laborFee: d.laborFee,
            note: d.note?.trim() || null,
            jobDate: d.jobDate,
          })
          .where(eq(repairJobs.id, d.id));

        const collected = txn.paidAmount; // tiền đã thu (bất biến khi sửa scope)
        let tip = 0;
        let newPaid = collected;
        if (total < collected) {
          tip = collected - total; // thu dư → tip
          newPaid = total;
        }

        await tx
          .update(transactions)
          .set({
            amount: total,
            paidAmount: newPaid,
            paymentStatus: derivePaymentStatus(newPaid, total),
            updatedBy: session.user.id,
          })
          .where(eq(transactions.id, txn.id));

        // Đồng bộ công nợ theo tổng/đã-thu mới.
        if (newPaid < total) {
          const name = d.counterpartyName?.trim() || debt?.counterpartyName || d.customerName;
          if (debt) {
            await tx
              .update(debts)
              .set({ total, paid: newPaid, counterpartyName: name, dueDate: d.dueDate?.trim() || debt.dueDate, settledAt: null })
              .where(eq(debts.id, debt.id));
          } else {
            await tx.insert(debts).values({
              transactionId: txn.id,
              direction: "receivable",
              counterpartyName: name,
              total,
              paid: newPaid,
              dueDate: d.dueDate?.trim() || null,
            });
          }
        } else if (debt) {
          // Đã thu đủ (hoặc dư) → tất toán công nợ.
          await tx
            .update(debts)
            .set({ total, paid: newPaid, settledAt: new Date() })
            .where(eq(debts.id, debt.id));
        }

        if (tip > 0) {
          await tx.insert(transactions).values({
            type: "income",
            amount: tip,
            paidAmount: tip,
            paymentStatus: "paid",
            businessLine: BUSINESS_LINE,
            userId: session.user.id,
            sourceKind: "manual",
            note: `Khách trả thêm (tip) — sửa xe ${d.customerName}`,
            transactedAt: dateToInstant(d.jobDate),
          });
        }
        return { ok: true as const };
      });

      if (!result.ok) {
        logWarn("updateRepairJob", result.error, { code: result.code, input: { id: d.id } });
        return { success: false, code: result.code, error: result.error };
      }
      revalidatePath("/");
      revalidatePath("/repair-jobs");
      revalidatePath(`/repair-jobs/${d.id}`);
      revalidatePath("/spare-parts");
      revalidatePath("/transactions/xe-muc");
      revalidatePath("/debts");
      return { success: true, data: undefined };
    } catch (err) {
      logError("updateRepairJob", err, { input: { id: d.id } });
      return { success: false, code: ErrorCode.INTERNAL_ERROR, error: "Không thể cập nhật job, thử lại." };
    }
  },
);

export const deleteRepairJob = withActionContext(
  "deleteRepairJob",
  async (_prev: ActionResult | null, formData: FormData): Promise<ActionResult> => {
    const session = await getCurrentSession();
    if (!session) return authError();
    setUserId(session.user.id);

    const parsed = deleteRepairJobSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodActionError(parsed.error);

    try {
      const result = await db.transaction(async (tx) => {
        const [job] = await tx
          .select()
          .from(repairJobs)
          .where(eq(repairJobs.id, parsed.data.id))
          .for("update")
          .limit(1);
        if (!job) return { ok: false as const, code: ErrorCode.NOT_FOUND, error: "Không tìm thấy job." };

        if (job.transactionId) {
          const [debt] = await tx
            .select({ paid: debts.paid })
            .from(debts)
            .where(eq(debts.transactionId, job.transactionId))
            .for("update")
            .limit(1);
          if (debt && debt.paid > 0)
            return { ok: false as const, code: ErrorCode.CONFLICT, error: "Không thể xoá: công nợ đã thu một phần." };
        }

        // Hoàn tồn các phụ tùng đã xuất.
        const oldParts = await tx
          .select({ sparePartId: repairJobParts.sparePartId, quantity: repairJobParts.quantity })
          .from(repairJobParts)
          .where(eq(repairJobParts.jobId, job.id));
        const partMap = await lockParts(tx, oldParts.map((p) => p.sparePartId));
        for (const p of oldParts) {
          const cur = partMap.get(p.sparePartId);
          if (cur) cur.quantity += Number(p.quantity);
        }
        for (const [partId, cur] of partMap) await setStock(tx, partId, cur.quantity);

        // Xoá job (cascade parts) trước (gỡ FK transaction_id) rồi xoá income (cascade debt).
        const txnId = job.transactionId;
        await tx.delete(repairJobs).where(eq(repairJobs.id, job.id));
        if (txnId) await tx.delete(transactions).where(eq(transactions.id, txnId));
        return { ok: true as const };
      });

      if (!result.ok) {
        logWarn("deleteRepairJob", result.error, { code: result.code, input: { id: parsed.data.id } });
        return { success: false, code: result.code, error: result.error };
      }
      revalidatePath("/");
      revalidatePath("/repair-jobs");
      revalidatePath("/spare-parts");
      revalidatePath("/transactions/xe-muc");
      revalidatePath("/debts");
      return { success: true, data: undefined };
    } catch (err) {
      logError("deleteRepairJob", err, { input: { id: parsed.data.id } });
      return { success: false, code: ErrorCode.INTERNAL_ERROR, error: "Không thể xoá job, thử lại." };
    }
  },
);
