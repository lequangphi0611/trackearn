# Server Actions

## File placement

Mỗi feature có 1 file `actions.ts` trong folder feature đó. `"use server"` đặt **đầu file**, không phải đầu từng function.

```
src/app/(dashboard)/transactions/actions.ts
src/app/(dashboard)/debts/actions.ts
```

## Return type — `ActionResult<T>`

Mọi Server Action trả `ActionResult<T>` (định nghĩa ở `src/lib/types.ts`). **Không throw ra ngoài** — catch và trả `{ success: false, … }`.

```ts
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code: ErrorCode; fieldErrors?: Record<string, string[]> };
```

- `code` dùng **hằng `ErrorCode`** (const object trong `types.ts`): `ErrorCode.AUTH_ERROR`, `ErrorCode.VALIDATION_ERROR`… — **KHÔNG hardcode chuỗi** `"AUTH_ERROR"`.
- Helper trả lỗi dùng type `ActionError` (nhánh `success:false`, không phụ thuộc `T`).
- Chi tiết taxonomy + cách hiển thị: xem [error-handling](./error-handling.md).

## Thứ tự cố định: auth → validate → execute

```ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { getCurrentSession } from "@/queries/session";
import { ErrorCode, type ActionResult } from "@/lib/types";
import { zodActionError } from "@/lib/form";
import { createTransactionSchema } from "./schema";

export async function createTransaction(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  // 1. Auth — getCurrentSession bọc React cache() (dedupe trong 1 request).
  const session = await getCurrentSession();
  if (!session) return { success: false, code: ErrorCode.AUTH_ERROR, error: "Chưa đăng nhập." };

  // 2. Validate (Zod). Lỗi → zodActionError (dùng chung, z.flattenError).
  const parsed = createTransactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodActionError(parsed.error);

  // 3. Execute — nhiều bảng thì gói trong db.transaction (xem data-model).
  try {
    const id = await db.transaction(async (tx) => {
      /* insert transaction, sinh debt nếu trả sau… */
      return "...";
    });
    revalidatePath("/transactions");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("[createTransaction]", err);
    return { success: false, code: ErrorCode.INTERNAL_ERROR, error: "Không thể tạo giao dịch, thử lại." };
  }
}
```

## Validation (Zod)

- Schema ở `feature/schema.ts`. Parse bằng `safeParse(Object.fromEntries(formData))`.
- Lỗi → **`zodActionError(parsed.error)`** (`src/lib/form.ts`) — nó dùng `z.flattenError` (zod 4, **không** `.flatten()`). Đừng viết lại helper này ở từng file.
- **Server là nguồn chân lý**: ép quy tắc nghiệp vụ ở server (business_line suy từ route, chi-phí-chung = expense, paid ≤ amount…), không tin giá trị client gửi lên.

## Auth

- Luôn dùng **`getCurrentSession()`** (`src/queries/session.ts`, bọc `cache()`), KHÔNG rải `auth.api.getSession` khắp nơi.
- Phân quyền: `session.user.role !== "owner"` → trả `ErrorCode.AUTH_ERROR` (defense-in-depth, ngoài việc gác ở route).

## Ghi DB: atomic + khóa dòng

Thao tác chạm nhiều bảng → `db.transaction`. Dòng có thể tranh chấp → `.for("update")`. **Thứ tự khóa `transaction` → `debt`** ở mọi action (tránh deadlock). Chi tiết: [data-model](./data-model.md).

## Dùng trong client component

```tsx
"use client";
const [state, formAction] = useActionState(createTransaction, null);
// <form action={formAction}> + <SubmitButton> (useFormStatus)
// getFormError(state) → fieldErrors (inline qua <Field>) + formError (Alert)
// success → toast + router.push/refresh. Action KHÔNG redirect() ở luồng cần set cookie.
```

Component dùng chung: `<Field>`, `<SubmitButton>` (`src/components/forms/`), `getFormError` (`src/lib/form.ts`) — không reinvent.

## Khi nào KHÔNG dùng Server Action

Dùng API route (`src/app/api/`) khi: client cần fetch (polling, search-as-you-type), export file (CSV/PDF), hoặc webhook bên ngoài.
