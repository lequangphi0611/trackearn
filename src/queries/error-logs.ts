import { desc } from "drizzle-orm";
import { db } from "@/db";
import { errorLogs } from "@/db/schema";

export type ErrorLogRow = typeof errorLogs.$inferSelect;

/** Lỗi runtime gần đây (mới nhất trước) cho trang chẩn đoán /admin. */
export async function getRecentErrors(limit = 100): Promise<ErrorLogRow[]> {
  return db
    .select()
    .from(errorLogs)
    .orderBy(desc(errorLogs.createdAt))
    .limit(limit);
}
