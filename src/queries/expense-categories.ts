import { asc } from "drizzle-orm";
import { db } from "@/db";
import { expenseCategories } from "@/db/schema";

/** Danh mục chi phí (đã seed), sắp theo sort_order — dùng cho select form. */
export async function getExpenseCategories() {
  return db
    .select({
      id: expenseCategories.id,
      name: expenseCategories.name,
      slug: expenseCategories.slug,
    })
    .from(expenseCategories)
    .orderBy(asc(expenseCategories.sortOrder));
}
