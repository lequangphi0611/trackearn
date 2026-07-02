import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { transactions, user } from "@/db/schema";

export async function ownerExists(): Promise<boolean> {
  const row = await db.query.user.findFirst({ where: eq(user.role, "owner") });
  return Boolean(row);
}

export type UserWithStats = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  banReason: string | null;
  createdAt: Date;
  hasTransactions: boolean;
};

// Tính cả updated_by: user từng sửa giao dịch cũng bị FK giữ lại khi xóa,
// và về nghiệp vụ vẫn là "đã tham gia giao dịch" (giữ dấu vết audit).
const hasTransactionsSql = sql<boolean>`exists (
  select 1 from ${transactions}
  where ${transactions.userId} = ${user.id} or ${transactions.updatedBy} = ${user.id}
)`;

/** Toàn bộ user + cờ "có giao dịch" cho màn /settings/users; owner đứng đầu. */
export async function listUsersWithStats(): Promise<UserWithStats[]> {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      createdAt: user.createdAt,
      hasTransactions: hasTransactionsSql,
    })
    .from(user)
    .orderBy(desc(eq(user.role, "owner")), user.createdAt);

  return rows.map((r) => ({ ...r, banned: r.banned ?? false }));
}

/** Guard xóa member: đã dính giao dịch (tạo hoặc sửa) thì không xóa được. */
export async function userHasTransactions(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ has: hasTransactionsSql })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return row?.has ?? false;
}
