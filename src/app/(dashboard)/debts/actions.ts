"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { debts, transactions } from "@/db/schema";
import { getCurrentSession } from "@/queries/session";
import { withActionContext } from "@/lib/action-context";
import { setUserId } from "@/lib/request-context";
import { logError, logWarn } from "@/lib/logger";
import { ErrorCode, type ActionResult } from "@/lib/types";
import {
  applyDebtPayment,
  derivePaymentStatus,
  type DebtDirection,
} from "@/lib/payment";
import { vnLocalToInstant } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import { zodActionError } from "@/lib/form";
import { recordPaymentSchema, updateDebtSchema } from "./schema";

export const recordDebtPayment = withActionContext(
  "recordDebtPayment",
  async (
    _prev: ActionResult | null,
    formData: FormData,
  ): Promise<ActionResult> => {
    const session = await getCurrentSession();
    if (!session)
      return {
        success: false,
        code: ErrorCode.AUTH_ERROR,
        error: "Chưa đăng nhập.",
      };
    setUserId(session.user.id);

    const parsed = recordPaymentSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodActionError(parsed.error);
    const { debtId, amountPaid, paidDate } = parsed.data;

    try {
      const result = await db.transaction(async (tx) => {
        // transaction_id bất biến → đọc trước (không khóa) để khóa theo thứ tự
        // transaction → debt, ĐỒNG NHẤT với updateTransaction/deleteTransaction
        // (tránh deadlock khi vừa ghi trả vừa sửa cùng giao dịch).
        const [link] = await tx
          .select({ transactionId: debts.transactionId })
          .from(debts)
          .where(eq(debts.id, debtId))
          .limit(1);
        if (!link)
          return {
            ok: false as const,
            code: ErrorCode.NOT_FOUND,
            error: "Không tìm thấy công nợ.",
          };

        const [txn] = await tx
          .select({
            id: transactions.id,
            businessLine: transactions.businessLine,
          })
          .from(transactions)
          .where(eq(transactions.id, link.transactionId))
          .for("update")
          .limit(1);

        // Khóa dòng công nợ để tránh lost update khi 2 người ghi trả cùng lúc.
        const [debt] = await tx
          .select()
          .from(debts)
          .where(eq(debts.id, debtId))
          .for("update")
          .limit(1);
        if (!debt)
          return {
            ok: false as const,
            code: ErrorCode.NOT_FOUND,
            error: "Không tìm thấy công nợ.",
          };
        if (debt.settledAt) {
          return {
            ok: false as const,
            code: ErrorCode.CONFLICT,
            error: "Công nợ đã tất toán.",
          };
        }

        // Quy tắc tip/tất toán/chặn trả quá nằm trong hàm thuần applyDebtPayment.
        const outcome = applyDebtPayment(
          {
            total: debt.total,
            paid: debt.paid,
            direction: debt.direction as DebtDirection,
          },
          amountPaid,
        );
        if (!outcome.ok) {
          return {
            ok: false as const,
            code: ErrorCode.VALIDATION_ERROR,
            error: `Không trả quá số còn lại (${formatCurrency(debt.total - debt.paid)}).`,
          };
        }
        const { newPaid, tip, settled } = outcome;
        const paidInstant = vnLocalToInstant(`${paidDate}T12:00`);

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

      if (!result.ok) {
        logWarn("recordDebtPayment", result.error, {
          code: result.code,
          input: { debtId: parsed.data.debtId },
        });
        return { success: false, code: result.code, error: result.error };
      }
      revalidatePath("/debts");
      revalidatePath("/transactions", "layout");
      return { success: true, data: undefined };
    } catch (err) {
      logError("recordDebtPayment", err, {
        input: { debtId: parsed.data.debtId },
      });
      return {
        success: false,
        code: ErrorCode.INTERNAL_ERROR,
        error: "Không thể ghi nhận, thử lại.",
      };
    }
  },
);

export const updateDebt = withActionContext(
  "updateDebt",
  async (
    _prev: ActionResult | null,
    formData: FormData,
  ): Promise<ActionResult> => {
    const session = await getCurrentSession();
    if (!session)
      return {
        success: false,
        code: ErrorCode.AUTH_ERROR,
        error: "Chưa đăng nhập.",
      };
    setUserId(session.user.id);

    const parsed = updateDebtSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodActionError(parsed.error);
    const { debtId, counterpartyName, dueDate } = parsed.data;

    try {
      await db
        .update(debts)
        .set({
          counterpartyName: counterpartyName.trim(),
          dueDate: dueDate?.trim() || null,
        })
        .where(eq(debts.id, debtId));
      revalidatePath("/debts");
      return { success: true, data: undefined };
    } catch (err) {
      logError("updateDebt", err, { input: { debtId: parsed.data.debtId } });
      return {
        success: false,
        code: ErrorCode.INTERNAL_ERROR,
        error: "Không thể cập nhật, thử lại.",
      };
    }
  },
);
