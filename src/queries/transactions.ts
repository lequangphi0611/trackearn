import { and, desc, eq, gte, ilike, isNull, lt, ne, or, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { debts, expenseCategories, transactions, user } from "@/db/schema";
import type { PaymentStatus, TransactionType } from "@/lib/payment";
import { vnDayRange } from "@/lib/date";

export const TRANSACTIONS_PAGE_SIZE = 20;
const MAX_PAGE = 50; // chặn trần load-more (tối đa 50 trang) tránh tải vô hạn

export type TransactionFilters = {
  // undefined = KHÔNG lọc mảng (tất cả, kể cả NULL) — view tổng hợp /transactions.
  // null = chi phí chung (business_line IS NULL); string = lọc đúng 1 mảng.
  businessLine: string | null | undefined;
  from?: Date;
  to?: Date;
  type?: TransactionType;
  status?: PaymentStatus;
  q?: string;
  // Lọc theo danh mục — chỉ đến từ link drill-down báo cáo (reports.md §4.5).
  categoryId?: string;
  // Loại trừ 1 danh mục (vd cost_of_goods) — categoryId NULL vẫn được GIỮ lại
  // (coi như "không phải danh mục bị loại"), khớp với cách getGrossProfitByLine
  // tính "chi phí mảng" (queries/reports.ts) để số 2 màn khớp tuyệt đối.
  excludeCategoryId?: string;
  page?: number;
};

function lineCondition(businessLine: string | null): SQL {
  return businessLine === null
    ? isNull(transactions.businessLine)
    : eq(transactions.businessLine, businessLine);
}

/** Danh sách giao dịch (1 mảng, hoặc tất cả nếu businessLine=undefined), có lọc + phân trang load-more (20 dòng). */
export async function getTransactions(f: TransactionFilters) {
  const page = Math.min(f.page ?? 0, MAX_PAGE);
  const take = (page + 1) * TRANSACTIONS_PAGE_SIZE; // load-more tích luỹ
  const conds: SQL[] = [];
  if (f.businessLine !== undefined) conds.push(lineCondition(f.businessLine));
  if (f.from) conds.push(gte(transactions.transactedAt, f.from));
  if (f.to) conds.push(lt(transactions.transactedAt, f.to));
  if (f.type) conds.push(eq(transactions.type, f.type));
  if (f.status) conds.push(eq(transactions.paymentStatus, f.status));
  if (f.categoryId) conds.push(eq(transactions.categoryId, f.categoryId));
  if (f.excludeCategoryId) {
    conds.push(
      or(isNull(transactions.categoryId), ne(transactions.categoryId, f.excludeCategoryId))!,
    );
  }
  if (f.q) {
    const like = `%${f.q}%`;
    conds.push(or(ilike(transactions.note, like), ilike(debts.counterpartyName, like))!);
  }

  const rows = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      paidAmount: transactions.paidAmount,
      paymentStatus: transactions.paymentStatus,
      businessLine: transactions.businessLine,
      note: transactions.note,
      transactedAt: transactions.transactedAt,
      sourceKind: transactions.sourceKind,
      sourceId: transactions.sourceId,
      categoryName: expenseCategories.name,
      userName: user.name,
      counterpartyName: debts.counterpartyName,
    })
    .from(transactions)
    .leftJoin(debts, eq(debts.transactionId, transactions.id))
    .leftJoin(expenseCategories, eq(expenseCategories.id, transactions.categoryId))
    .leftJoin(user, eq(user.id, transactions.userId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(transactions.transactedAt))
    .limit(take + 1);

  const hasMore = rows.length > take;
  return { items: hasMore ? rows.slice(0, take) : rows, hasMore };
}

/** Giao dịch trong 1 ngày VN (mọi mảng), mới nhất trước — cho dashboard. */
export async function getTransactionsByDate(dateISO: string) {
  return getByDate(dateISO);
}

/** Giao dịch CỦA MỘT NGƯỜI trong 1 ngày VN — bản dashboard rút gọn cho member. */
export async function getMyTransactionsByDate(dateISO: string, userId: string) {
  return getByDate(dateISO, userId);
}

async function getByDate(dateISO: string, userId?: string) {
  const { from, to } = vnDayRange(dateISO);
  const conds: SQL[] = [
    gte(transactions.transactedAt, from),
    lt(transactions.transactedAt, to),
  ];
  if (userId) conds.push(eq(transactions.userId, userId));

  // 1 ngày của hộ kinh doanh nhỏ → ít dòng, không cần phân trang.
  return db
    .select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      paidAmount: transactions.paidAmount,
      paymentStatus: transactions.paymentStatus,
      businessLine: transactions.businessLine,
      note: transactions.note,
      transactedAt: transactions.transactedAt,
      sourceKind: transactions.sourceKind,
      categoryName: expenseCategories.name,
      userName: user.name,
      counterpartyName: debts.counterpartyName,
    })
    .from(transactions)
    .leftJoin(debts, eq(debts.transactionId, transactions.id))
    .leftJoin(expenseCategories, eq(expenseCategories.id, transactions.categoryId))
    .leftJoin(user, eq(user.id, transactions.userId))
    .where(and(...conds))
    .orderBy(desc(transactions.transactedAt));
}

/** Chi tiết 1 giao dịch + công nợ (nếu có) + tên danh mục/người tạo/người sửa. */
export async function getTransactionById(id: string) {
  const editor = alias(user, "editor");
  const [row] = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      paidAmount: transactions.paidAmount,
      paymentStatus: transactions.paymentStatus,
      businessLine: transactions.businessLine,
      categoryId: transactions.categoryId,
      categoryName: expenseCategories.name,
      note: transactions.note,
      transactedAt: transactions.transactedAt,
      createdAt: transactions.createdAt,
      updatedAt: transactions.updatedAt,
      sourceKind: transactions.sourceKind,
      sourceId: transactions.sourceId,
      userId: transactions.userId,
      userName: user.name,
      updatedById: transactions.updatedBy,
      updatedByName: editor.name,
      debtId: debts.id,
      debtPaid: debts.paid,
      debtTotal: debts.total,
      counterpartyName: debts.counterpartyName,
      dueDate: debts.dueDate,
      settledAt: debts.settledAt,
    })
    .from(transactions)
    .leftJoin(debts, eq(debts.transactionId, transactions.id))
    .leftJoin(expenseCategories, eq(expenseCategories.id, transactions.categoryId))
    .leftJoin(user, eq(user.id, transactions.userId))
    .leftJoin(editor, eq(editor.id, transactions.updatedBy))
    .where(eq(transactions.id, id))
    .limit(1);

  return row ?? null;
}
