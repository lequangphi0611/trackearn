# Data Fetching

## Nguyên tắc cốt lõi

**Server fetch là default.** Client fetch chỉ dùng khi có lý do rõ ràng (xem bên dưới). Không bao giờ dùng `useEffect` + `fetch` để lấy data hiển thị ban đầu.

## Server Components (cách chính)

Server Component fetch trực tiếp qua query function — không qua REST API:

```tsx
// ✅ — app/(dashboard)/transactions/page.tsx
import { getTransactions } from "@/queries/transactions"

export default async function TransactionsPage() {
  const transactions = await getTransactions()
  return <TransactionList transactions={transactions} />
}
```

## Query functions (`src/queries/`)

Mọi Drizzle SELECT query đặt trong `src/queries/[feature].ts`. Không viết query thẳng trong component hay actions.

```ts
// src/queries/transactions.ts
import { db } from "@/db"
import { transactions } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"

type Transaction = InferSelectModel<typeof transactions>

export async function getTransactions(): Promise<Transaction[]> {
  return db.select().from(transactions).orderBy(desc(transactions.transacted_at))
}

export async function getTransactionById(id: string): Promise<Transaction | undefined> {
  const result = await db.select().from(transactions).where(eq(transactions.id, id))
  return result[0]
}
```

## Auth trong queries

Kiểm tra session trong layout hoặc đầu query function — không để component con tự kiểm tra:

```ts
// src/queries/reports.ts — chỉ owner được xem
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export async function getMonthlyReport(month: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== "owner") redirect("/")
  // ... query
}
```

## Suspense boundaries

Đặt `<Suspense>` ở **page level**, không ở component con:

```tsx
// ✅ — page.tsx
import { Suspense } from "react"

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TransactionSkeleton />}>
      <TransactionList />
    </Suspense>
  )
}

// ❌ — component tự bọc Suspense cho chính nó
```

## Khi nào dùng client fetch

Client fetch (SWR / fetch trong client component) chỉ hợp lý khi:

- Data thay đổi real-time và cần auto-refresh (VD: live status)
- User interaction trigger fetch mà Server Action không phù hợp (VD: search-as-you-type)

Khi dùng client fetch → **bắt buộc** đi qua API route (`src/app/api/`), không gọi thẳng Drizzle từ client.

```ts
// Client component
const response = await fetch("/api/transactions?month=2026-01")

// src/app/api/transactions/route.ts
export async function GET(request: Request) { ... }
```
