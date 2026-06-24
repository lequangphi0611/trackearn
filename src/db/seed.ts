import "./load-env";
import { db } from "./index";
import { expenseCategories } from "./schema";

// Danh mục chi phí hệ thống (is_system = true). `other` là fallback bắt buộc.
// Xem docs/spec/expenses.md.
const SYSTEM_EXPENSE_CATEGORIES = [
  { slug: "cost_of_goods", name: "Vốn hàng (mua máy / nhập phụ tùng, phụ kiện)", sortOrder: 1 },
  { slug: "electricity", name: "Điện", sortOrder: 2 },
  { slug: "water", name: "Nước", sortOrder: 3 },
  { slug: "fuel", name: "Xăng dầu", sortOrder: 4 },
  { slug: "rent", name: "Thuê mặt bằng", sortOrder: 5 },
  { slug: "labor", name: "Công thợ / lương", sortOrder: 6 },
  { slug: "tools", name: "Dụng cụ", sortOrder: 7 },
  { slug: "shipping", name: "Vận chuyển", sortOrder: 8 },
  { slug: "hospitality", name: "Tiếp khách / ăn uống", sortOrder: 9 },
  { slug: "other", name: "Khác", sortOrder: 10 },
];

async function seed() {
  await db
    .insert(expenseCategories)
    .values(
      SYSTEM_EXPENSE_CATEGORIES.map((c) => ({ ...c, isSystem: true })),
    )
    .onConflictDoNothing({ target: expenseCategories.slug });

  console.log(`Seeded ${SYSTEM_EXPENSE_CATEGORIES.length} expense categories (idempotent).`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed]", err);
    process.exit(1);
  });
