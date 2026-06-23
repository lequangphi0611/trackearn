# Component Rules

## Export

Luôn dùng `export const`, không dùng `export default`.

```ts
// ✅
export const TransactionForm = () => { ... }

// ❌
export default function TransactionForm() { ... }
```

## "use client"

Đặt càng sâu càng tốt — chỉ ở component thực sự cần browser API hoặc event handlers. Layout và page giữ nguyên là Server Component.

```
page.tsx (Server)
└── TransactionList.tsx (Server)
    └── TransactionRow.tsx (Server)
        └── DeleteButton.tsx  ← "use client" chỉ ở đây
```

Dấu hiệu cần `"use client"`:
- Dùng `useState`, `useEffect`, `useRef`
- Attach event handler (`onClick`, `onChange`) trực tiếp với state
- Dùng browser API (`window`, `localStorage`)

Truyền Server Component qua `children` vào Client Component để tránh phải đẩy `"use client"` lên cao:

```tsx
// ✅
// ServerParent.tsx (Server)
export const ServerParent = () => (
  <ClientWrapper>
    <ServerChild /> {/* vẫn là Server Component */}
  </ClientWrapper>
)
```

## Khi nào tách component

Theo thứ tự ưu tiên:

1. **Logic phức tạp** — component có logic riêng biệt (fetch, state machine, tính toán) → tách ngay dù ngắn.
2. **Tái sử dụng** — dùng ở 2+ nơi → tách và đặt vào đúng scope (feature hay shared).
3. **Quá dài** — component vượt ~150 dòng mà không có lý do trên → tách theo nhóm UI có nghĩa.

Không tách chỉ vì "trông có vẻ lớn" nếu logic thực sự thuộc về nhau.

## Props

Định nghĩa props bằng `type`, đặt ngay trên component, không export nếu không cần:

```ts
type TransactionRowProps = {
  transaction: Transaction
  onDelete: (id: string) => void
}

export const TransactionRow = ({ transaction, onDelete }: TransactionRowProps) => { ... }
```

## Props drilling → Zustand

Nếu state phải đi qua 2+ component trung gian không dùng nó (pure pass-through) → chuyển sang Zustand store. Nếu chỉ 1 level hoặc component nhận trực tiếp dùng → giữ props.
