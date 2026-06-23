# State Management

## Phân loại state

| Loại | Giải pháp | Ví dụ |
|------|-----------|-------|
| Server data | RSC + `revalidatePath` | Danh sách giao dịch, báo cáo tháng |
| Form state | `useState` / `useActionState` | Input field, validation message |
| Shared UI state | Zustand | Sidebar open/close, filter đang chọn |
| URL state | `searchParams` | Tháng đang xem, tab đang active |

## Server data — không cache ở client

Data từ server không được lưu lại ở client state. Sau khi mutation, gọi `revalidatePath` để Next.js re-fetch:

```ts
// ✅ — trong actions.ts
revalidatePath("/transactions")
return { success: true, data: newTransaction }

// ❌ — client tự sync state
const [transactions, setTransactions] = useState(initialData)
// ... sau mutation: setTransactions([...transactions, newItem])
```

## useState — chỉ cho UI state cục bộ

`useState` chỉ hợp lý cho:
- Form input chưa submit
- Toggle (modal open, dropdown)
- Optimistic UI tạm thời

Không dùng `useState` để lưu data đã fetch từ server.

## Zustand — khi nào dùng

Dùng Zustand khi state cần chia sẻ và phải đi qua 2+ component trung gian không dùng nó (pure pass-through).

```ts
// src/lib/stores/filter-store.ts
import { create } from "zustand"

type FilterStore = {
  selectedMonth: string
  selectedBusinessLine: string | null
  setMonth: (month: string) => void
  setBusinessLine: (id: string | null) => void
}

export const useFilterStore = create<FilterStore>((set) => ({
  selectedMonth: new Date().toISOString().slice(0, 7),
  selectedBusinessLine: null,
  setMonth: (month) => set({ selectedMonth: month }),
  setBusinessLine: (id) => set({ selectedBusinessLine: id }),
}))
```

Store files đặt tại `src/lib/stores/[name]-store.ts`.

## URL state — ưu tiên cho filter/navigation

Filter tháng, tab active, search query nên là `searchParams` thay vì state — shareable và bookmarkable:

```tsx
// ✅ — dùng searchParams
// /transactions?month=2026-01&businessLine=xe_muc

// ❌ — giữ filter trong useState/Zustand khi URL là đủ
```
