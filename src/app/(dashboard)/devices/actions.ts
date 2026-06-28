"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { debts, devices, expenseCategories, transactions } from "@/db/schema";
import { getCurrentSession } from "@/queries/session";
import { withActionContext } from "@/lib/action-context";
import { setUserId } from "@/lib/request-context";
import { logError, logWarn } from "@/lib/logger";
import { ErrorCode, type ActionError, type ActionResult } from "@/lib/types";
import { derivePaymentStatus } from "@/lib/payment";
import { vnLocalToInstant } from "@/lib/date";
import { zodActionError } from "@/lib/form";
import {
  cancelSellSchema,
  createDeviceSchema,
  sellDeviceSchema,
  updateDeviceSchema,
} from "./schema";

const BUSINESS_LINE = "thiet_bi"; // mảng thiết bị điện tử
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// date "YYYY-MM-DD" → instant giữa trưa VN (tránh lệch ngày khi đổi tz).
function dateToInstant(d: string): Date {
  return vnLocalToInstant(`${d}T12:00`);
}

async function costOfGoodsCategory(tx: Tx): Promise<string | null> {
  const [row] = await tx
    .select({ id: expenseCategories.id })
    .from(expenseCategories)
    .where(eq(expenseCategories.slug, "cost_of_goods"))
    .limit(1);
  return row?.id ?? null;
}

function authError(): ActionError {
  return { success: false, code: ErrorCode.AUTH_ERROR, error: "Chưa đăng nhập." };
}

export const createDevice = withActionContext(
  "createDevice",
  async (
    _prev: ActionResult<{ id: string }> | null,
    formData: FormData,
  ): Promise<ActionResult<{ id: string }>> => {
    const session = await getCurrentSession();
    if (!session) return authError();
    setUserId(session.user.id);

    const parsed = createDeviceSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodActionError(parsed.error);
    const d = parsed.data;
    const paymentStatus = derivePaymentStatus(d.paidAmount, d.buyPrice);

    try {
      const id = await db.transaction(async (tx) => {
        const categoryId = await costOfGoodsCategory(tx);
        const [device] = await tx
          .insert(devices)
          .values({
            name: d.name,
            conditionNote: d.conditionNote?.trim() || null,
            buyPrice: d.buyPrice,
            buyDate: d.buyDate,
            buyFrom: d.buyFrom?.trim() || null,
            status: "in_stock",
          })
          .returning({ id: devices.id });

        const [txn] = await tx
          .insert(transactions)
          .values({
            type: "expense",
            amount: d.buyPrice,
            paidAmount: d.paidAmount,
            paymentStatus,
            businessLine: BUSINESS_LINE,
            categoryId,
            userId: session.user.id,
            sourceKind: "device_buy",
            sourceId: device.id,
            note: `Mua máy: ${d.name}`,
            transactedAt: dateToInstant(d.buyDate),
          })
          .returning({ id: transactions.id });

        if (d.paidAmount < d.buyPrice) {
          await tx.insert(debts).values({
            transactionId: txn.id,
            direction: "payable",
            counterpartyName: d.counterpartyName!.trim(),
            total: d.buyPrice,
            paid: d.paidAmount,
            dueDate: d.dueDate?.trim() || null,
          });
        }

        await tx
          .update(devices)
          .set({ buyTransactionId: txn.id })
          .where(eq(devices.id, device.id));
        return device.id;
      });

      revalidatePath("/devices");
      revalidatePath("/transactions/thiet-bi");
      revalidatePath("/debts");
      return { success: true, data: { id } };
    } catch (err) {
      logError("createDevice", err, { input: { name: d.name } });
      return {
        success: false,
        code: ErrorCode.INTERNAL_ERROR,
        error: "Không thể nhập máy, thử lại.",
      };
    }
  },
);

export const updateDevice = withActionContext(
  "updateDevice",
  async (_prev: ActionResult | null, formData: FormData): Promise<ActionResult> => {
    const session = await getCurrentSession();
    if (!session) return authError();
    setUserId(session.user.id);

    const parsed = updateDeviceSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodActionError(parsed.error);
    const d = parsed.data;

    try {
      const result = await db.transaction(async (tx) => {
        const [device] = await tx
          .select()
          .from(devices)
          .where(eq(devices.id, d.id))
          .for("update")
          .limit(1);
        if (!device)
          return { ok: false as const, code: ErrorCode.NOT_FOUND, error: "Không tìm thấy máy." };

        const name = d.name.trim();
        const conditionNote = d.conditionNote?.trim() || null;

        // Máy đã bán: chỉ cho sửa tên + tình trạng (giá/ngày xử lý qua hủy bán).
        if (device.status !== "in_stock") {
          await tx.update(devices).set({ name, conditionNote }).where(eq(devices.id, d.id));
          return { ok: true as const };
        }

        // Máy còn hàng: sửa tự do; đổi giá mua → đồng bộ giao dịch mua + công nợ.
        const newBuyPrice = d.buyPrice ?? device.buyPrice;
        await tx
          .update(devices)
          .set({
            name,
            conditionNote,
            buyPrice: newBuyPrice,
            buyDate: d.buyDate?.trim() || device.buyDate,
            buyFrom: d.buyFrom?.trim() || null,
          })
          .where(eq(devices.id, d.id));

        if (d.buyPrice !== undefined && d.buyPrice !== device.buyPrice && device.buyTransactionId) {
          const [debt] = await tx
            .select()
            .from(debts)
            .where(eq(debts.transactionId, device.buyTransactionId))
            .for("update")
            .limit(1);

          let newPaid: number;
          if (debt) {
            if (newBuyPrice < debt.paid) {
              if (!d.confirmReduce)
                return {
                  ok: false as const,
                  code: ErrorCode.CONFLICT,
                  error: "Giá mua mới nhỏ hơn số đã trả — cần xác nhận.",
                };
              newPaid = newBuyPrice; // hạ đã-trả xuống bằng giá mới (đã đồng ý)
            } else {
              newPaid = debt.paid;
            }
            const settledAt = newPaid >= newBuyPrice ? new Date() : null;
            await tx
              .update(debts)
              .set({ total: newBuyPrice, paid: newPaid, settledAt })
              .where(eq(debts.id, debt.id));
          } else {
            newPaid = newBuyPrice; // mua trả đủ → giữ trả đủ theo giá mới
          }

          await tx
            .update(transactions)
            .set({
              amount: newBuyPrice,
              paidAmount: newPaid,
              paymentStatus: derivePaymentStatus(newPaid, newBuyPrice),
              updatedBy: session.user.id,
            })
            .where(eq(transactions.id, device.buyTransactionId));
        }

        return { ok: true as const };
      });

      if (!result.ok) {
        logWarn("updateDevice", result.error, { code: result.code, input: { id: d.id } });
        return { success: false, code: result.code, error: result.error };
      }
      revalidatePath("/devices");
      revalidatePath(`/devices/${d.id}`);
      revalidatePath("/transactions/thiet-bi");
      revalidatePath("/debts");
      return { success: true, data: undefined };
    } catch (err) {
      logError("updateDevice", err, { input: { id: d.id } });
      return {
        success: false,
        code: ErrorCode.INTERNAL_ERROR,
        error: "Không thể cập nhật, thử lại.",
      };
    }
  },
);

export const sellDevice = withActionContext(
  "sellDevice",
  async (_prev: ActionResult | null, formData: FormData): Promise<ActionResult> => {
    const session = await getCurrentSession();
    if (!session) return authError();
    setUserId(session.user.id);

    const parsed = sellDeviceSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodActionError(parsed.error);
    const d = parsed.data;
    const paymentStatus = derivePaymentStatus(d.paidAmount, d.sellPrice);

    try {
      const result = await db.transaction(async (tx) => {
        const [device] = await tx
          .select()
          .from(devices)
          .where(eq(devices.id, d.id))
          .for("update")
          .limit(1);
        if (!device)
          return { ok: false as const, code: ErrorCode.NOT_FOUND, error: "Không tìm thấy máy." };
        if (device.status !== "in_stock")
          return { ok: false as const, code: ErrorCode.CONFLICT, error: "Máy đã được bán." };

        const [txn] = await tx
          .insert(transactions)
          .values({
            type: "income",
            amount: d.sellPrice,
            paidAmount: d.paidAmount,
            paymentStatus,
            businessLine: BUSINESS_LINE,
            userId: session.user.id,
            sourceKind: "device_sell",
            sourceId: device.id,
            note: `Bán máy: ${device.name}`,
            transactedAt: dateToInstant(d.sellDate),
          })
          .returning({ id: transactions.id });

        if (d.paidAmount < d.sellPrice) {
          await tx.insert(debts).values({
            transactionId: txn.id,
            direction: "receivable",
            counterpartyName: d.counterpartyName!.trim(),
            total: d.sellPrice,
            paid: d.paidAmount,
            dueDate: d.dueDate?.trim() || null,
          });
        }

        await tx
          .update(devices)
          .set({
            sellPrice: d.sellPrice,
            sellDate: d.sellDate,
            status: "sold",
            sellTransactionId: txn.id,
          })
          .where(eq(devices.id, device.id));
        return { ok: true as const };
      });

      if (!result.ok) {
        logWarn("sellDevice", result.error, { code: result.code, input: { id: d.id } });
        return { success: false, code: result.code, error: result.error };
      }
      revalidatePath("/devices");
      revalidatePath(`/devices/${d.id}`);
      revalidatePath("/transactions/thiet-bi");
      revalidatePath("/debts");
      return { success: true, data: undefined };
    } catch (err) {
      logError("sellDevice", err, { input: { id: d.id } });
      return {
        success: false,
        code: ErrorCode.INTERNAL_ERROR,
        error: "Không thể bán máy, thử lại.",
      };
    }
  },
);

export const cancelSell = withActionContext(
  "cancelSell",
  async (_prev: ActionResult | null, formData: FormData): Promise<ActionResult> => {
    const session = await getCurrentSession();
    if (!session) return authError();
    setUserId(session.user.id);

    const parsed = cancelSellSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodActionError(parsed.error);

    try {
      const result = await db.transaction(async (tx) => {
        const [device] = await tx
          .select()
          .from(devices)
          .where(eq(devices.id, parsed.data.id))
          .for("update")
          .limit(1);
        if (!device)
          return { ok: false as const, code: ErrorCode.NOT_FOUND, error: "Không tìm thấy máy." };
        if (device.status !== "sold")
          return { ok: false as const, code: ErrorCode.CONFLICT, error: "Máy chưa bán." };

        if (device.sellTransactionId) {
          const [debt] = await tx
            .select({ id: debts.id, paid: debts.paid })
            .from(debts)
            .where(eq(debts.transactionId, device.sellTransactionId))
            .for("update")
            .limit(1);
          if (debt && debt.paid > 0)
            return {
              ok: false as const,
              code: ErrorCode.CONFLICT,
              error: "Không thể hủy bán: công nợ bán đã thu một phần.",
            };
        }

        // Gỡ FK trên device trước rồi mới xoá giao dịch bán (cascade xoá debt).
        const sellTxnId = device.sellTransactionId;
        await tx
          .update(devices)
          .set({
            status: "in_stock",
            sellPrice: null,
            sellDate: null,
            sellTransactionId: null,
          })
          .where(eq(devices.id, device.id));
        if (sellTxnId) await tx.delete(transactions).where(eq(transactions.id, sellTxnId));
        return { ok: true as const };
      });

      if (!result.ok) {
        logWarn("cancelSell", result.error, {
          code: result.code,
          input: { id: parsed.data.id },
        });
        return { success: false, code: result.code, error: result.error };
      }
      revalidatePath("/devices");
      revalidatePath(`/devices/${parsed.data.id}`);
      revalidatePath("/transactions/thiet-bi");
      revalidatePath("/debts");
      return { success: true, data: undefined };
    } catch (err) {
      logError("cancelSell", err, { input: { id: parsed.data.id } });
      return {
        success: false,
        code: ErrorCode.INTERNAL_ERROR,
        error: "Không thể hủy bán, thử lại.",
      };
    }
  },
);
