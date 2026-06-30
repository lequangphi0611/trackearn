import { and, desc, eq, gte, ilike, lte, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { debts, devices, transactions } from "@/db/schema";

export const DEVICES_PAGE_SIZE = 20;
const MAX_PAGE = 50; // chặn trần load-more tránh tải vô hạn

export type DeviceStatusFilter = "in_stock" | "sold" | "all";

export type DeviceFilters = {
  status?: DeviceStatusFilter; // mặc định all
  from?: string; // buy_date >= (YYYY-MM-DD)
  to?: string; // buy_date <= (YYYY-MM-DD)
  q?: string;
  page?: number;
};

/** Tổng vốn tồn = Σ buy_price các máy còn hàng. */
export async function getStockCapital(): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${devices.buyPrice}), 0)` })
    .from(devices)
    .where(eq(devices.status, "in_stock"));
  return Number(row?.total ?? 0);
}

/** Tóm tắt kho máy còn hàng: số lượng + tổng vốn (1 query, cho hub /kho). */
export async function getInStockSummary(): Promise<{ count: number; capital: number }> {
  const [row] = await db
    .select({
      count: sql<string>`count(*)`,
      capital: sql<string>`coalesce(sum(${devices.buyPrice}), 0)`,
    })
    .from(devices)
    .where(eq(devices.status, "in_stock"));
  return { count: Number(row?.count ?? 0), capital: Number(row?.capital ?? 0) };
}

/** Danh sách máy có lọc + phân trang load-more (20 dòng), mới nhất trước. */
export async function getDevices(f: DeviceFilters) {
  const page = Math.min(f.page ?? 0, MAX_PAGE);
  const take = (page + 1) * DEVICES_PAGE_SIZE;
  const conds: SQL[] = [];
  if (f.status && f.status !== "all") conds.push(eq(devices.status, f.status));
  if (f.from) conds.push(gte(devices.buyDate, f.from));
  if (f.to) conds.push(lte(devices.buyDate, f.to));
  if (f.q) {
    const like = `%${f.q}%`;
    conds.push(or(ilike(devices.name, like), ilike(devices.conditionNote, like))!);
  }

  const rows = await db
    .select({
      id: devices.id,
      name: devices.name,
      conditionNote: devices.conditionNote,
      buyPrice: devices.buyPrice,
      buyDate: devices.buyDate,
      sellPrice: devices.sellPrice,
      sellDate: devices.sellDate,
      status: devices.status,
    })
    .from(devices)
    .where(conds.length ? and(...conds) : undefined)
    // sắp theo ngày mua mới nhất; id phụ để ổn định khi cùng ngày.
    .orderBy(desc(devices.buyDate), desc(devices.id))
    .limit(take + 1);

  const hasMore = rows.length > take;
  return { items: hasMore ? rows.slice(0, take) : rows, hasMore };
}

/**
 * Chi tiết 1 máy + thông tin công nợ của giao dịch bán (để chặn hủy bán khi đã
 * thu một phần). debtPaid là số đã thu của giao dịch bán (null nếu không có).
 */
export async function getDeviceById(id: string) {
  const sellDebt = alias(debts, "sell_debt");
  const buyDebt = alias(debts, "buy_debt");
  const [row] = await db
    .select({
      id: devices.id,
      name: devices.name,
      conditionNote: devices.conditionNote,
      buyPrice: devices.buyPrice,
      buyDate: devices.buyDate,
      buyFrom: devices.buyFrom,
      sellPrice: devices.sellPrice,
      sellDate: devices.sellDate,
      status: devices.status,
      buyTransactionId: devices.buyTransactionId,
      sellTransactionId: devices.sellTransactionId,
      // Đã thu của giao dịch bán (chặn hủy bán) / đã trả của giao dịch mua
      // (cảnh báo khi hạ giá mua dưới số đã trả).
      sellDebtPaid: sellDebt.paid,
      buyDebtPaid: buyDebt.paid,
    })
    .from(devices)
    .leftJoin(sellDebt, eq(sellDebt.transactionId, devices.sellTransactionId))
    .leftJoin(buyDebt, eq(buyDebt.transactionId, devices.buyTransactionId))
    .where(eq(devices.id, id))
    .limit(1);

  return row ?? null;
}

/** Giá mua hiện tại của transaction nguồn (dùng khi sửa giá máy còn hàng). */
export async function getDeviceBuyTransaction(buyTransactionId: string) {
  const [row] = await db
    .select({ id: transactions.id, amount: transactions.amount })
    .from(transactions)
    .where(eq(transactions.id, buyTransactionId))
    .limit(1);
  return row ?? null;
}
