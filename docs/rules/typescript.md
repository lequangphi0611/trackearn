# TypeScript Rules

## type vs interface

Luôn dùng `type`, không dùng `interface`.

```ts
// ✅
type Transaction = {
  id: string
  amount: number
  paymentStatus: "paid" | "partial" | "pending"
}

// ❌
interface Transaction { ... }
```

## any

Hạn chế tối đa. Chỉ cho phép trong 2 trường hợp:

1. **Type từ thư viện third-party chưa có declaration** — bắt buộc kèm comment giải thích thư viện nào.
2. **Migration code tạm thời** — bắt buộc comment `// TODO: remove any`.

```ts
// ✅ — third-party không có types
const data = response as any // better-auth internal type
// TODO: remove any

// ❌ — lười type
const handleSubmit = (data: any) => { ... }
```

Thay thế `any` bằng `unknown` + type narrowing:

```ts
// ✅
function parseError(err: unknown): string {
  if (err instanceof Error) return err.message
  return "Lỗi không xác định"
}
```

## Return types

- **Bắt buộc khai báo explicit** cho: Server Actions, query functions trong `src/queries/`.
- **Inferred** cho: component props nội bộ, local variables, event handlers.

```ts
// ✅ — explicit cho query
export async function getTransactions(userId: string): Promise<Transaction[]> { ... }

// ✅ — explicit cho Server Action
export async function createTransaction(
  data: CreateTransactionInput
): Promise<ActionResult<Transaction>> { ... }
```

## Utility types

Ưu tiên dùng Drizzle-inferred types thay vì tự define lại:

```ts
import type { InferSelectModel, InferInsertModel } from "drizzle-orm"
import { transactions } from "@/db/schema"

type Transaction = InferSelectModel<typeof transactions>
type NewTransaction = InferInsertModel<typeof transactions>
```

## Strict mode

`tsconfig.json` phải bật `"strict": true`. Không tắt bất kỳ strict flag nào.
