"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { debts, transactions } from "@/db/schema";
import { getCurrentSession } from "@/queries/session";
import { ErrorCode, type ActionError, type ActionResult } from "@/lib/types";
import { derivePaymentStatus } from "@/lib/payment";
import { vnLocalToInstant } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import { recordPaymentSchema, updateDebtSchema } from "./schema";

function validationError(error: z.ZodError): ActionError {
  return {
    success: false,
    code: ErrorCode.VALIDATION_ERROR,
    error: "Dữ liệu không hợp lệ",
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[]>,
  };
}

export async function recordDebtPayment(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getCurrentSession();
  if (!session) return { success: false, code: ErrorCode.AUTH_ERROR, error: "Chưa đăng nhập." };

  const parsed = recordPaymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  const { debtId, amountPaid, paidDate } = parsed.data;

  try {
    const result = await db.transaction(async (tx) => {
      // Khóa dòng công nợ để tránh lost update khi 2 người ghi trả cùng lúc.
      const [debt] = await tx
        .select()
        .from(debts)
        .where(eq(debts.id, debtId))
        .for("update")
        .limit(1);
      if (!debt) return { ok: false as const, code: ErrorCode.NOT_FOUND, error: "Không tìm thấy công nợ." };
      if (debt.settledAt) {
        return { ok: false as const, code: ErrorCode.CONFLICT, error: "Công nợ đã tất toán." };
      }

      const [txn] = await tx
        .select({
          id: transactions.id,
          businessLine: transactions.businessLine,
        })
        .from(transactions)
        .where(eq(transactions.id, debt.transactionId))
        .for("update")
        .limit(1);

      const remaining = debt.total - debt.paid;
      const paidInstant = vnLocalToInstant(`${paidDate}T12:00`);

      let tip = 0;
      let newPaid: number;
      if (debt.direction === "payable") {
        // Mình trả NCC — không trả dư.
        if (amountPaid > remaining) {
          return {
            ok: false as const,
            code: ErrorCode.VALIDATION_ERROR,
            error: `Không trả quá số còn lại (${formatCurrency(remaining)}).`,
          };
        }
        newPaid = debt.paid + amountPaid;
      } else {
        // receivable — khách trả dư → phần vượt thành tip.
        if (amountPaid > remaining) {
          tip = amountPaid - remaining;
          newPaid = debt.total;
        } else {
          newPaid = debt.paid + amountPaid;
        }
      }

      const settled = newPaid >= debt.total;
      await tx
        .update(debts)
        .set({ paid: newPaid, settledAt: settled ? paidInstant : null })
        .where(eq(debts.id, debt.id));

      await tx
        .update(transactions)
        .set({
          paidAmount: newPaid,
          paymentStatus: derivePaymentStatus(newPaid, debt.total),
          updatedBy: session.user.id,
        })
        .where(eq(transactions.id, debt.transactionId));

      // Khoản tip = income riêng, trả đủ ngay, gắn mảng giao dịch gốc.
      if (tip > 0 && txn) {
        await tx.insert(transactions).values({
          type: "income",
          amount: tip,
          paidAmount: tip,
          paymentStatus: "paid",
          businessLine: txn.businessLine,
          userId: session.user.id,
          sourceKind: "manual",
          note: "Khách trả thêm (tip)",
          transactedAt: paidInstant,
        });
      }

      return { ok: true as const };
    });

    if (!result.ok) return { success: false, code: result.code, error: result.error };
    revalidatePath("/debts");
    revalidatePath("/transactions", "layout");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[recordDebtPayment]", err);
    return { success: false, code: ErrorCode.INTERNAL_ERROR, error: "Không thể ghi nhận, thử lại." };
  }
}

export async function updateDebt(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getCurrentSession();
  if (!session) return { success: false, code: ErrorCode.AUTH_ERROR, error: "Chưa đăng nhập." };

  const parsed = updateDebtSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  const { debtId, counterpartyName, dueDate } = parsed.data;

  try {
    await db
      .update(debts)
      .set({ counterpartyName: counterpartyName.trim(), dueDate: dueDate?.trim() || null })
      .where(eq(debts.id, debtId));
    revalidatePath("/debts");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[updateDebt]", err);
    return { success: false, code: ErrorCode.INTERNAL_ERROR, error: "Không thể cập nhật, thử lại." };
  }
}
