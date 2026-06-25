import { and, desc, eq, gte, ilike, isNull, lt, or, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { debts, expenseCategories, transactions, user } from "@/db/schema";
import type { PaymentStatus, TransactionType } from "@/lib/payment";

export const TRANSACTIONS_PAGE_SIZE = 20;

export type TransactionFilters = {
  // null = chi phí chung (business_line IS NULL); ngược lại lọc đúng mảng.
  businessLine: string | null;
  from?: Date;
  to?: Date;
  type?: TransactionType;
  status?: PaymentStatus;
  q?: string;
  page?: number;
};

function lineCondition(businessLine: string | null): SQL {
  return businessLine === null
    ? isNull(transactions.businessLine)
    : eq(transactions.businessLine, businessLine);
}

/** Danh sách giao dịch của một mảng, có lọc + phân trang load-more (20 dòng). */
export async function getTransactions(f: TransactionFilters) {
  const page = f.page ?? 0;
  const take = (page + 1) * TRANSACTIONS_PAGE_SIZE; // load-more tích luỹ
  const conds: SQL[] = [lineCondition(f.businessLine)];
  if (f.from) conds.push(gte(transactions.transactedAt, f.from));
  if (f.to) conds.push(lt(transactions.transactedAt, f.to));
  if (f.type) conds.push(eq(transactions.type, f.type));
  if (f.status) conds.push(eq(transactions.paymentStatus, f.status));
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
    .where(and(...conds))
    .orderBy(desc(transactions.transactedAt))
    .limit(take + 1);

  const hasMore = rows.length > take;
  return { items: hasMore ? rows.slice(0, take) : rows, hasMore };
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
