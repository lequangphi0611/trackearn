# Server Actions

## File placement

Mỗi feature có 1 file `actions.ts` riêng trong folder feature:

```
src/app/(dashboard)/transactions/actions.ts
src/app/(dashboard)/devices/actions.ts
src/app/(dashboard)/debts/actions.ts
```

`"use server"` đặt ở đầu file, không phải đầu từng function.

## Return type chuẩn

Mọi Server Action trả về `ActionResult<T>`:

```ts
// src/lib/types.ts
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
```

Không throw exception ra ngoài — catch và trả về `{ success: false, error }`:

```ts
// src/app/(dashboard)/transactions/actions.ts
"use server"

import { db } from "@/db"
import { transactions } from "@/db/schema"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/lib/types"

export const createTransaction = async (
  input: CreateTransactionInput
): Promise<ActionResult<{ id: string }>> => {
  try {
    const [row] = await db.insert(transactions).values(input).returning({ id: transactions.id })
    revalidatePath("/transactions")
    return { success: true, data: { id: row.id } }
  } catch (err) {
    console.error("[createTransaction]", err)
    return { success: false, error: "Không thể tạo giao dịch. Vui lòng thử lại." }
  }
}
```

## Validation

Validate input bằng Zod trước khi ghi DB:

```ts
import { z } from "zod"

const CreateTransactionSchema = z.object({
  amount: z.number().positive(),
  businessLineId: z.string().uuid(),
  note: z.string().optional(),
})

export const createTransaction = async (raw: unknown): Promise<ActionResult> => {
  const parsed = CreateTransactionSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }
  // ...
}
```

## Auth trong actions

Kiểm tra session ở đầu mỗi action trước khi làm bất cứ điều gì:

```ts
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export const deleteTransaction = async (id: string): Promise<ActionResult> => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { success: false, error: "Chưa đăng nhập." }
  if (session.user.role !== "owner") return { success: false, error: "Không có quyền." }
  // ...
}
```

## Dùng trong component

```tsx
"use client"

import { createTransaction } from "./actions"

export const TransactionForm = () => {
  const handleSubmit = async (formData: FormData) => {
    const result = await createTransaction({ ... })
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success("Đã tạo giao dịch")
  }
  // ...
}
```

## Khi nào KHÔNG dùng Server Action

Dùng API route thay thế khi:
- Client component cần fetch (SWR, polling)
- Cần trả về file (CSV, PDF export)
- Webhook từ service bên ngoài gọi vào
