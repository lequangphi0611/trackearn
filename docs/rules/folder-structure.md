# Folder Structure

## Nguyên tắc

Feature-based: mọi thứ liên quan đến một tính năng nằm cùng nhau. Không tổ chức theo type (`/all-components`, `/all-actions`).

## Cấu trúc chuẩn

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # dashboard ngày
│   │   ├── transactions/
│   │   │   ├── page.tsx
│   │   │   ├── actions.ts              # Server Actions
│   │   │   └── components/
│   │   │       ├── TransactionForm.tsx
│   │   │       └── TransactionList.tsx
│   │   ├── devices/
│   │   ├── spare-parts/
│   │   ├── debts/
│   │   ├── repair-jobs/
│   │   └── reports/
│   └── api/                            # chỉ cho webhook / export
├── components/
│   ├── ui/                             # shadcn/ui primitives — không sửa
│   └── forms/                          # shared form components
├── queries/                            # Drizzle read queries, tách theo feature
│   ├── transactions.ts
│   ├── devices.ts
│   ├── debts.ts
│   └── ...
├── db/
│   ├── schema.ts
│   └── index.ts
└── lib/
    ├── auth.ts
    └── utils.ts
```

## Rules

**Feature actions.ts** — mỗi feature có 1 file `actions.ts` riêng nằm trong folder feature đó. Không gộp chung.

**Feature components/** — component chỉ dùng trong 1 feature thì đặt trong `feature/components/`. Component dùng ở 2+ feature thì chuyển lên `src/components/`.

**src/queries/** — chỉ chứa read queries (Drizzle SELECT). Mutations thuộc về `actions.ts`.

**Không dùng barrel files** — không tạo `index.ts` để re-export. Import thẳng từ file nguồn.

```ts
// ✅
import { getTransactions } from "@/queries/transactions"

// ❌
import { getTransactions } from "@/queries"
```

**API routes** (`src/app/api/`) — chỉ tạo khi cần webhook từ bên ngoài hoặc file export (CSV, PDF). Không dùng cho CRUD thông thường.
