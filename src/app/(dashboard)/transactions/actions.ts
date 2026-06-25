"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { debts, expenseCategories, transactions } from "@/db/schema";
import { getCurrentSession } from "@/queries/session";
import { ErrorCode, type ActionResult } from "@/lib/types";
import { derivePaymentStatus, deriveDirection, type TransactionType } from "@/lib/payment";
import { vnLocalToInstant } from "@/lib/date";
import { zodActionError } from "@/lib/form";
import { getTransactionLine } from "@/lib/transaction-lines";
import {
  createTransactionSchema,
  deleteTransactionSchema,
  updateTransactionSchema,
} from "./schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function resolveExpenseCategory(
  tx: Tx,
  type: TransactionType,
  categoryId: string | undefined,
): Promise<string | null> {
  if (type !== "expense") return null; // income không có danh mục
  if (categoryId) return categoryId;
  const [other] = await tx
    .select({ id: expenseCategories.id })
    .from(expenseCategories)
    .where(eq(expenseCategories.slug, "other"))
    .limit(1);
  return other?.id ?? null;
}

export async function createTransaction(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await getCurrentSession();
  if (!session) return { success: false, code: ErrorCode.AUTH_ERROR, error: "Chưa đăng nhập." };

  const parsed = createTransactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodActionError(parsed.error);

  const data = parsed.data;
  const lineConfig = getTransactionLine(data.line);
  if (!lineConfig) {
    return { success: false, code: ErrorCode.VALIDATION_ERROR, error: "Mảng không hợp lệ." };
  }
  // Màn chi-phí-chung chỉ cho expense; ép server-side, không tin client.
  const type: TransactionType = lineConfig.expenseOnly ? "expense" : data.type;
  const businessLine = lineConfig.businessLine;
  const transactedAt = vnLocalToInstant(data.transactedAt);
  const paymentStatus = derivePaymentStatus(data.paidAmount, data.amount);

  try {
    const id = await db.transaction(async (tx) => {
      const categoryId = await resolveExpenseCategory(tx, type, data.categoryId);
      const [row] = await tx
        .insert(transactions)
        .values({
          type,
          amount: data.amount,
          paidAmount: data.paidAmount,
          paymentStatus,
          businessLine,
          categoryId,
          userId: session.user.id,
          sourceKind: "manual",
          note: data.note?.trim() || null,
          transactedAt,
        })
        .returning({ id: transactions.id });

      // Trả sau → sinh công nợ.
      if (data.paidAmount < data.amount) {
        await tx.insert(debts).values({
          transactionId: row.id,
          direction: deriveDirection(type),
          counterpartyName: data.counterpartyName!.trim(),
          total: data.amount,
          paid: data.paidAmount,
          dueDate: data.dueDate?.trim() || null,
        });
      }
      return row.id;
    });

    revalidatePath(`/transactions/${data.line}`);
    revalidatePath("/debts");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("[createTransaction]", err);
    return { success: false, code: ErrorCode.INTERNAL_ERROR, error: "Không thể tạo giao dịch, thử lại." };
  }
}

export async function updateTransaction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getCurrentSession();
  if (!session) return { success: false, code: ErrorCode.AUTH_ERROR, error: "Chưa đăng nhập." };

  const parsed = updateTransactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodActionError(parsed.error);
  const data = parsed.data;

  try {
    const result = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(transactions)
        .where(eq(transactions.id, data.id))
        .for("update")
        .limit(1);
      if (!current) return { ok: false as const, code: ErrorCode.NOT_FOUND, error: "Không tìm thấy giao dịch." };
      if (current.sourceKind !== "manual") {
        return { ok: false as const, code: ErrorCode.CONFLICT, error: "Giao dịch tự sinh không sửa trực tiếp." };
      }

      const [debt] = await tx
        .select()
        .from(debts)
        .where(eq(debts.transactionId, data.id))
        .for("update")
        .limit(1);

      const categoryId = await resolveExpenseCategory(
        tx,
        current.type as TransactionType,
        data.categoryId,
      );
      const transactedAt = vnLocalToInstant(data.transactedAt);
      const note = data.note?.trim() || null;

      let newPaid: number;
      if (debt) {
        // paid là tiền thực nhận (nguồn chân lý = debt.paid).
        if (data.amount < debt.paid) {
          if (!data.confirmReduce) {
            return {
              ok: false as const,
              code: ErrorCode.CONFLICT,
              error: "Số tiền mới nhỏ hơn số đã trả — cần xác nhận.",
            };
          }
          newPaid = data.amount; // hạ đã-trả xuống bằng số tiền mới (user đã đồng ý)
        } else {
          newPaid = debt.paid;
        }
        const settledAt = newPaid >= data.amount ? new Date() : null;
        await tx
          .update(debts)
          .set({
            total: data.amount,
            paid: newPaid,
            counterpartyName: data.counterpartyName?.trim() || debt.counterpartyName,
            dueDate: data.dueDate?.trim() || null,
            settledAt,
          })
          .where(eq(debts.id, debt.id));
      } else {
        // Không có công nợ = đã thanh toán đủ; sửa amount giữ trả đủ.
        newPaid = data.amount;
      }

      await tx
        .update(transactions)
        .set({
          amount: data.amount,
          paidAmount: newPaid,
          paymentStatus: derivePaymentStatus(newPaid, data.amount),
          categoryId,
          note,
          transactedAt,
          updatedBy: session.user.id,
        })
        .where(eq(transactions.id, data.id));

      return { ok: true as const, businessLine: current.businessLine };
    });

    if (!result.ok) return { success: false, code: result.code, error: result.error };
    revalidatePath("/transactions", "layout");
    revalidatePath("/debts");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[updateTransaction]", err);
    return { success: false, code: ErrorCode.INTERNAL_ERROR, error: "Không thể cập nhật, thử lại." };
  }
}

export async function deleteTransaction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getCurrentSession();
  if (!session) return { success: false, code: ErrorCode.AUTH_ERROR, error: "Chưa đăng nhập." };

  const parsed = deleteTransactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodActionError(parsed.error);

  try {
    const result = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(transactions)
        .where(eq(transactions.id, parsed.data.id))
        .for("update")
        .limit(1);
      if (!current) return { ok: false as const, code: ErrorCode.NOT_FOUND, error: "Không tìm thấy giao dịch." };
      if (current.sourceKind !== "manual") {
        return { ok: false as const, code: ErrorCode.CONFLICT, error: "Giao dịch tự sinh không xoá ở đây." };
      }
      const [debt] = await tx
        .select({ paid: debts.paid })
        .from(debts)
        .where(eq(debts.transactionId, parsed.data.id))
        .limit(1);
      if (debt && debt.paid > 0) {
        return {
          ok: false as const,
          code: ErrorCode.CONFLICT,
          error: "Không thể xoá: công nợ đã trả một phần.",
        };
      }
      // Cascade sẽ xoá luôn debt (chưa trả) theo FK on delete cascade.
      await tx.delete(transactions).where(eq(transactions.id, parsed.data.id));
      return { ok: true as const, businessLine: current.businessLine };
    });

    if (!result.ok) return { success: false, code: result.code, error: result.error };
    revalidatePath("/transactions", "layout");
    revalidatePath("/debts");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deleteTransaction]", err);
    return { success: false, code: ErrorCode.INTERNAL_ERROR, error: "Không thể xoá, thử lại." };
  }
}
