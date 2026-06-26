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

Lấy session qua **`getCurrentSession()`** (`src/queries/session.ts`) — bọc React `cache()` nên layout + page gọi nhiều lần chỉ xác thực **1 lần/request**. KHÔNG gọi `auth.api.getSession` rải rác.

```ts
// src/queries/reports.ts — chỉ owner được xem
import { redirect } from "next/navigation"
import { getCurrentSession } from "@/queries/session"

export async function getMonthlyReport(month: string) {
  const session = await getCurrentSession()
  if (!session || session.user.role !== "owner") redirect("/")
  // ... query
}
```

> Query function được phép trả **shape chiếu/join** (chọn cột, join nhiều bảng) — không bắt buộc trả nguyên `InferSelectModel`. Component nhận đúng shape qua `Awaited<ReturnType<typeof getX>>`.

## Streaming, Skeleton & Load-more

**Stream phần chậm (DB) trong `<Suspense>`** để khung trang hiện ngay, danh sách hiện skeleton rồi mới tới — quan trọng trên mobile 3G.

- Tách phần fetch DB vào **component con async** (vd `TransactionResults`); page chỉ render khung (tiêu đề, bộ lọc) + `<Suspense fallback={<…Skeleton/>}>`.
- **`key` của Suspense đặt theo BỘ LỌC, KHÔNG theo `page`** → đổi bộ lọc thì hiện skeleton; bấm "Xem thêm" thì **không** nhấp nháy skeleton (giữ nội dung cũ).
- Skeleton phải **cùng hình dáng** với nội dung thật (tránh nhảy layout).
- Màn lá không có load-more (form, chi tiết) → dùng `loading.tsx` của route.

```tsx
// page.tsx — khung hiện ngay, list stream
<Suspense key={filterKey} fallback={<TransactionListSkeleton />}>
  <TransactionResults query={query} moreHref={moreHref} />
</Suspense>
```

**Load-more** dùng component `<LoadMore href>` (`src/components/LoadMore.tsx`): `<Link scroll={false}>` (không nhảy về đầu trang) + spinner pending qua `useLinkStatus`. Phân trang tích lũy, chặn trần `MAX_PAGE` trong query.

Quality floor: tôn trọng `prefers-reduced-motion` (đã set global ở `globals.css`).

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
