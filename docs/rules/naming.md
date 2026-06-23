# Naming Conventions

## Files & Folders

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Component | `PascalCase.tsx` | `TransactionForm.tsx` |
| Non-component | `kebab-case.ts` | `format-currency.ts` |
| Feature folder | `kebab-case/` | `spare-parts/`, `repair-jobs/` |
| Route segment | `kebab-case/` | `app/(dashboard)/repair-jobs/` |

## TypeScript

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Type / generic | `PascalCase` | `Transaction`, `ApiResponse<T>` |
| Variable / function | `camelCase` | `totalAmount`, `formatCurrency` |
| Constant module-level | `SCREAMING_SNAKE_CASE` | `MAX_DEBT_DAYS` |
| Enum (nếu dùng) | `PascalCase` key + value | `PaymentStatus.Paid` |

## Functions — prefix theo intent

| Prefix | Dùng cho | Ví dụ |
|--------|---------|-------|
| `get` | Query trả về data | `getTransactions`, `getDeviceById` |
| `create` / `update` / `delete` | Server Action mutation | `createTransaction`, `updateDebt` |
| `format` | Pure transform / display | `formatCurrency`, `formatDate` |
| `calculate` | Business logic thuần | `calculateDebtTotal` |
| `is` / `has` | Boolean predicate | `isPaid`, `hasOverdueDebt` |

## Database (Drizzle schema)

- Tên bảng: `snake_case`, số nhiều — `transactions`, `repair_jobs`
- Tên cột: `snake_case` — `business_line_id`, `transacted_at`
- Tên relation/index: `snake_case` mô tả — `transactions_user_id_idx`
