import { and, asc, ilike, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { spareParts } from "@/db/schema";

export const SPARE_PARTS_PAGE_SIZE = 20;
const MAX_PAGE = 50;

export type SparePartFilters = {
  q?: string;
  lowOnly?: boolean; // chỉ hiện phụ tùng tồn <= ngưỡng
  page?: number;
};

/** Danh sách phụ tùng + tìm + lọc tồn thấp + load-more (sắp theo tên). */
export async function getSpareParts(f: SparePartFilters) {
  const page = Math.min(f.page ?? 0, MAX_PAGE);
  const take = (page + 1) * SPARE_PARTS_PAGE_SIZE;
  const conds: SQL[] = [];
  if (f.q) conds.push(ilike(spareParts.name, `%${f.q}%`));
  if (f.lowOnly) conds.push(sql`${spareParts.quantity} <= ${spareParts.minQuantity}`);

  const rows = await db
    .select({
      id: spareParts.id,
      name: spareParts.name,
      unit: spareParts.unit,
      quantity: spareParts.quantity,
      buyPrice: spareParts.buyPrice,
      minQuantity: spareParts.minQuantity,
    })
    .from(spareParts)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(spareParts.name))
    .limit(take + 1);

  const hasMore = rows.length > take;
  return { items: hasMore ? rows.slice(0, take) : rows, hasMore };
}

/** Đếm phụ tùng đang tồn thấp (quantity <= min_quantity) — cho badge hub. */
export async function getLowStockCount(): Promise<number> {
  const [row] = await db
    .select({ n: sql<string>`count(*)` })
    .from(spareParts)
    .where(sql`${spareParts.quantity} <= ${spareParts.minQuantity}`);
  return Number(row?.n ?? 0);
}

/** Toàn bộ phụ tùng cho picker khi tạo job (id, tên, đơn vị, tồn, giá vốn). */
export async function getSparePartsForPicker() {
  return db
    .select({
      id: spareParts.id,
      name: spareParts.name,
      unit: spareParts.unit,
      quantity: spareParts.quantity,
      buyPrice: spareParts.buyPrice,
    })
    .from(spareParts)
    .orderBy(asc(spareParts.name));
}

export async function getSparePartById(id: string) {
  const [row] = await db
    .select()
    .from(spareParts)
    .where(sql`${spareParts.id} = ${id}`)
    .limit(1);
  return row ?? null;
}
