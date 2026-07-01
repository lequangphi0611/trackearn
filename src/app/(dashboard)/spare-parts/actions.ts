"use server";

import { revalidatePath } from "next/cache";
import { eq, ilike } from "drizzle-orm";
import { db } from "@/db";
import { expenseCategories, repairJobParts, spareParts, transactions } from "@/db/schema";
import { getCurrentSession } from "@/queries/session";
import { withActionContext } from "@/lib/action-context";
import { setUserId } from "@/lib/request-context";
import { logError, logWarn } from "@/lib/logger";
import { ErrorCode, type ActionError, type ActionResult } from "@/lib/types";
import { zodActionError } from "@/lib/form";
import {
  adjustStockSchema,
  createOrRestockSchema,
  deleteSparePartSchema,
  restockSchema,
  updateSparePartSchema,
} from "./schema";

const BUSINESS_LINE = "xe_muc";
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Part = typeof spareParts.$inferSelect;

function authError(): ActionError {
  return { success: false, code: ErrorCode.AUTH_ERROR, error: "Chưa đăng nhập." };
}

async function costOfGoodsCategory(tx: Tx): Promise<string | null> {
  const [row] = await tx
    .select({ id: expenseCategories.id })
    .from(expenseCategories)
    .where(eq(expenseCategories.slug, "cost_of_goods"))
    .limit(1);
  return row?.id ?? null;
}

/** Giá vốn mới theo bình quân gia quyền (làm tròn đồng). Guard tồn≤0 → giá nhập. */
function weightedBuyPrice(qOld: number, pOld: number, qIn: number, pIn: number): number {
  if (qOld <= 0) return pIn;
  return Math.round((qOld * pOld + qIn * pIn) / (qOld + qIn));
}

/**
 * Cộng tồn + cập nhật BQGQ + sinh expense cost_of_goods/xe_muc cho 1 lần nhập.
 * `part` phải đã khóa FOR UPDATE. Trả về tồn/giá mới.
 */
async function applyRestock(tx: Tx, userId: string, part: Part, qIn: number, pIn: number) {
  const qOld = Number(part.quantity);
  const newPrice = weightedBuyPrice(qOld, part.buyPrice, qIn, pIn);
  const newQty = qOld + qIn;

  await tx
    .update(spareParts)
    .set({ quantity: String(newQty), buyPrice: newPrice })
    .where(eq(spareParts.id, part.id));

  const categoryId = await costOfGoodsCategory(tx);
  const amount = Math.round(qIn * pIn);
  await tx.insert(transactions).values({
    type: "expense",
    amount,
    paidAmount: amount, // nhập kho trả đủ (không công nợ ở bước này)
    paymentStatus: "paid",
    businessLine: BUSINESS_LINE,
    categoryId,
    userId,
    sourceKind: "manual", // người dùng chủ động nhập kho
    note: `Nhập phụ tùng: ${part.name}`,
    transactedAt: new Date(),
  });
}

export const createOrRestockSparePart = withActionContext(
  "createOrRestockSparePart",
  async (
    _prev: ActionResult<{ id: string }> | null,
    formData: FormData,
  ): Promise<ActionResult<{ id: string }>> => {
    const session = await getCurrentSession();
    if (!session) return authError();
    setUserId(session.user.id);

    const parsed = createOrRestockSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodActionError(parsed.error);
    const d = parsed.data;

    try {
      const id = await db.transaction(async (tx) => {
        // Trùng tên (không phân biệt hoa thường) → cộng dồn vào phụ tùng đó.
        const [existing] = await tx
          .select()
          .from(spareParts)
          .where(ilike(spareParts.name, d.name))
          .for("update")
          .limit(1);

        if (existing) {
          await applyRestock(tx, session.user.id, existing, d.quantity, d.buyPrice);
          return existing.id;
        }

        const [row] = await tx
          .insert(spareParts)
          .values({
            name: d.name,
            unit: d.unit,
            quantity: String(d.quantity),
            buyPrice: d.buyPrice,
            minQuantity: String(d.minQuantity ?? 0),
          })
          .returning({ id: spareParts.id });

        const categoryId = await costOfGoodsCategory(tx);
        const amount = Math.round(d.quantity * d.buyPrice);
        await tx.insert(transactions).values({
          type: "expense",
          amount,
          paidAmount: amount,
          paymentStatus: "paid",
          businessLine: BUSINESS_LINE,
          categoryId,
          userId: session.user.id,
          sourceKind: "manual",
          note: `Nhập phụ tùng: ${d.name}`,
          transactedAt: new Date(),
        });
        return row.id;
      });

      revalidatePath("/spare-parts");
      revalidatePath("/transactions/xe-muc");
      return { success: true, data: { id } };
    } catch (err) {
      logError("createOrRestockSparePart", err, { input: { name: d.name } });
      return { success: false, code: ErrorCode.INTERNAL_ERROR, error: "Không thể nhập, thử lại." };
    }
  },
);

export const restockSparePart = withActionContext(
  "restockSparePart",
  async (_prev: ActionResult | null, formData: FormData): Promise<ActionResult> => {
    const session = await getCurrentSession();
    if (!session) return authError();
    setUserId(session.user.id);

    const parsed = restockSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodActionError(parsed.error);
    const d = parsed.data;

    try {
      const result = await db.transaction(async (tx) => {
        const [part] = await tx
          .select()
          .from(spareParts)
          .where(eq(spareParts.id, d.id))
          .for("update")
          .limit(1);
        if (!part)
          return { ok: false as const, code: ErrorCode.NOT_FOUND, error: "Không tìm thấy phụ tùng." };
        await applyRestock(tx, session.user.id, part, d.quantity, d.buyPrice);
        return { ok: true as const };
      });
      if (!result.ok) {
        logWarn("restockSparePart", result.error, { code: result.code, input: { id: d.id } });
        return { success: false, code: result.code, error: result.error };
      }
      revalidatePath("/spare-parts");
      revalidatePath(`/spare-parts/${d.id}`);
      revalidatePath("/transactions/xe-muc");
      return { success: true, data: undefined };
    } catch (err) {
      logError("restockSparePart", err, { input: { id: d.id } });
      return { success: false, code: ErrorCode.INTERNAL_ERROR, error: "Không thể nhập, thử lại." };
    }
  },
);

export const updateSparePart = withActionContext(
  "updateSparePart",
  async (_prev: ActionResult | null, formData: FormData): Promise<ActionResult> => {
    const session = await getCurrentSession();
    if (!session) return authError();
    setUserId(session.user.id);

    const parsed = updateSparePartSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodActionError(parsed.error);
    const d = parsed.data;

    try {
      await db
        .update(spareParts)
        .set({ name: d.name, unit: d.unit, minQuantity: String(d.minQuantity) })
        .where(eq(spareParts.id, d.id));
      revalidatePath("/spare-parts");
      revalidatePath(`/spare-parts/${d.id}`);
      return { success: true, data: undefined };
    } catch (err) {
      logError("updateSparePart", err, { input: { id: d.id } });
      return { success: false, code: ErrorCode.INTERNAL_ERROR, error: "Không thể cập nhật, thử lại." };
    }
  },
);

// Kiểm kê: đặt tồn thực đếm được — KHÔNG sinh expense (chỉ đính chính số đếm).
export const adjustStock = withActionContext(
  "adjustStock",
  async (_prev: ActionResult | null, formData: FormData): Promise<ActionResult> => {
    const session = await getCurrentSession();
    if (!session) return authError();
    setUserId(session.user.id);

    const parsed = adjustStockSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodActionError(parsed.error);
    const d = parsed.data;

    try {
      await db
        .update(spareParts)
        .set({ quantity: String(d.quantity) })
        .where(eq(spareParts.id, d.id));
      revalidatePath("/spare-parts");
      revalidatePath(`/spare-parts/${d.id}`);
      return { success: true, data: undefined };
    } catch (err) {
      logError("adjustStock", err, { input: { id: d.id } });
      return { success: false, code: ErrorCode.INTERNAL_ERROR, error: "Không thể cập nhật tồn, thử lại." };
    }
  },
);

export const deleteSparePart = withActionContext(
  "deleteSparePart",
  async (_prev: ActionResult | null, formData: FormData): Promise<ActionResult> => {
    const session = await getCurrentSession();
    if (!session) return authError();
    setUserId(session.user.id);

    const parsed = deleteSparePartSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodActionError(parsed.error);

    try {
      const result = await db.transaction(async (tx) => {
        // Chặn nếu đã xuất cho bất kỳ job nào (giữ toàn vẹn lịch sử lãi).
        const [used] = await tx
          .select({ id: repairJobParts.id })
          .from(repairJobParts)
          .where(eq(repairJobParts.sparePartId, parsed.data.id))
          .limit(1);
        if (used)
          return {
            ok: false as const,
            code: ErrorCode.CONFLICT,
            error: "Không thể xoá: phụ tùng đã xuất cho job.",
          };
        await tx.delete(spareParts).where(eq(spareParts.id, parsed.data.id));
        return { ok: true as const };
      });
      if (!result.ok) {
        logWarn("deleteSparePart", result.error, { code: result.code, input: { id: parsed.data.id } });
        return { success: false, code: result.code, error: result.error };
      }
      revalidatePath("/spare-parts");
      return { success: true, data: undefined };
    } catch (err) {
      logError("deleteSparePart", err, { input: { id: parsed.data.id } });
      return { success: false, code: ErrorCode.INTERNAL_ERROR, error: "Không thể xoá, thử lại." };
    }
  },
);
