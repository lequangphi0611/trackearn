import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  uuid,
  bigint,
  integer,
  numeric,
  date,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role").default("member").notNull(),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { withTimezone: true }),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// ---------------------------------------------------------------------------
// Bảng nghiệp vụ (xem docs/architecture.md, docs/spec/expenses.md)
// Quy ước: id uuid, tiền bigint (đồng, mode number), audit user_id/updated_by
// là text FK -> user.id. business_line lưu text (xem src/lib/constants.ts).
// ---------------------------------------------------------------------------

export const expenseCategories = pgTable("expense_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  isSystem: boolean("is_system").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: text("type").notNull(), // income | expense
    amount: bigint("amount", { mode: "number" }).notNull(),
    paidAmount: bigint("paid_amount", { mode: "number" }).default(0).notNull(),
    businessLine: text("business_line"), // xe_muc | thiet_bi | phu_kien | NULL = chi phí chung
    userId: text("user_id")
      .notNull()
      .references(() => user.id), // người nhập
    categoryId: uuid("category_id").references(() => expenseCategories.id), // chỉ chi phí mới có
    sourceKind: text("source_kind").default("manual").notNull(), // manual | repair_job | device_buy | device_sell
    sourceId: uuid("source_id"),
    note: text("note"),
    transactedAt: timestamp("transacted_at", { withTimezone: true }).defaultNow().notNull(),
    paymentStatus: text("payment_status").notNull(), // paid | partial | pending
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    updatedBy: text("updated_by").references(() => user.id),
  },
  (table) => [
    index("transactions_user_id_idx").on(table.userId),
    index("transactions_business_line_idx").on(table.businessLine),
    index("transactions_transacted_at_idx").on(table.transactedAt),
  ],
);

export const debts = pgTable("debts", {
  id: uuid("id").defaultRandom().primaryKey(),
  // unique: 1 giao dịch ↔ tối đa 1 công nợ (auto-tạo index, không cần index riêng).
  transactionId: uuid("transaction_id")
    .notNull()
    .unique()
    .references(() => transactions.id, { onDelete: "cascade" }),
  direction: text("direction").notNull(), // receivable | payable
  counterpartyName: text("counterparty_name").notNull(),
  total: bigint("total", { mode: "number" }).notNull(),
  paid: bigint("paid", { mode: "number" }).default(0).notNull(),
  dueDate: date("due_date"),
  settledAt: timestamp("settled_at", { withTimezone: true }),
});

export const devices = pgTable("devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  conditionNote: text("condition_note"),
  buyPrice: bigint("buy_price", { mode: "number" }).notNull(),
  buyDate: date("buy_date"),
  buyFrom: text("buy_from"),
  sellPrice: bigint("sell_price", { mode: "number" }),
  sellDate: date("sell_date"),
  status: text("status").default("in_stock").notNull(), // in_stock | sold
  // Liên kết tới giao dịch tự sinh (chi khi mua / thu khi bán) — xem spec/devices.md.
  buyTransactionId: uuid("buy_transaction_id").references(() => transactions.id),
  sellTransactionId: uuid("sell_transaction_id").references(() => transactions.id),
});

export const spareParts = pgTable("spare_parts", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  // numeric: cho phép đơn vị lẻ (vd lít dầu). buy_price là tiền (bigint đồng).
  quantity: numeric("quantity", { precision: 14, scale: 3 }).default("0").notNull(),
  buyPrice: bigint("buy_price", { mode: "number" }).notNull(),
  minQuantity: numeric("min_quantity", { precision: 14, scale: 3 })
    .default("0")
    .notNull(),
});

export const repairJobs = pgTable("repair_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerName: text("customer_name").notNull(),
  laborFee: bigint("labor_fee", { mode: "number" }).default(0).notNull(),
  note: text("note"),
  jobDate: date("job_date"),
  transactionId: uuid("transaction_id").references(() => transactions.id),
});

export const repairJobParts = pgTable(
  "repair_job_parts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => repairJobs.id, { onDelete: "cascade" }),
    sparePartId: uuid("spare_part_id")
      .notNull()
      .references(() => spareParts.id),
    quantity: numeric("quantity", { precision: 14, scale: 3 }).notNull(),
    unitPrice: bigint("unit_price", { mode: "number" }).notNull(),
    costPrice: bigint("cost_price", { mode: "number" }).notNull(), // giá vốn lúc xuất
  },
  (table) => [
    index("repair_job_parts_job_id_idx").on(table.jobId),
    index("repair_job_parts_spare_part_id_idx").on(table.sparePartId),
  ],
);

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  user: one(user, { fields: [transactions.userId], references: [user.id] }),
  category: one(expenseCategories, {
    fields: [transactions.categoryId],
    references: [expenseCategories.id],
  }),
  debts: many(debts),
}));

export const debtsRelations = relations(debts, ({ one }) => ({
  transaction: one(transactions, {
    fields: [debts.transactionId],
    references: [transactions.id],
  }),
}));

export const repairJobsRelations = relations(repairJobs, ({ one, many }) => ({
  transaction: one(transactions, {
    fields: [repairJobs.transactionId],
    references: [transactions.id],
  }),
  parts: many(repairJobParts),
}));

export const repairJobPartsRelations = relations(repairJobParts, ({ one }) => ({
  job: one(repairJobs, {
    fields: [repairJobParts.jobId],
    references: [repairJobs.id],
  }),
  sparePart: one(spareParts, {
    fields: [repairJobParts.sparePartId],
    references: [spareParts.id],
  }),
}));
