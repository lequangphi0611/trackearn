# Error Handling

## ActionResult type

```ts
// src/lib/types.ts
type ErrorCode =
  | "VALIDATION_ERROR"   // Zod fail
  | "AUTH_ERROR"         // chưa đăng nhập, sai role, hoặc session hết hạn — dùng cho cả authentication lẫn authorization
  | "NOT_FOUND"          // record không tồn tại
  | "CONFLICT"           // duplicate / constraint violation
  | "INTERNAL_ERROR"     // unexpected (DB crash, network, v.v.)

type ActionResult<T = void> =
  | { success: true; data: T }
  | {
      success: false
      error: string                              // message tiếng Việt cho user
      code: ErrorCode                            // để client quyết định behavior
      fieldErrors?: Record<string, string[]>     // chỉ có khi code === "VALIDATION_ERROR"
    }
```

## Server Actions — pattern chuẩn

Thứ tự cố định trong mọi action: **auth → validate → execute**.

```ts
// src/app/(dashboard)/transactions/actions.ts
"use server"

export const createTransaction = async (
  input: unknown
): Promise<ActionResult<{ id: string }>> => {
  // 1. Auth
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { success: false, error: "Phiên đăng nhập đã hết hạn.", code: "AUTH_ERROR" }
  }

  // 2. Validate
  const parsed = CreateTransactionSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: "Dữ liệu không hợp lệ.",
      code: "VALIDATION_ERROR",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  // 3. Execute
  try {
    const [row] = await db
      .insert(transactions)
      .values(parsed.data)
      .returning({ id: transactions.id })
    revalidatePath("/transactions")
    return { success: true, data: { id: row.id } }
  } catch (err) {
    console.error("[createTransaction]", { input: parsed.data, error: err })
    return { success: false, error: "Đã có lỗi xảy ra. Vui lòng thử lại.", code: "INTERNAL_ERROR" }
  }
}
```

## Logging

Dùng `console.error` trên server. Không dùng external logging service.

Format bắt buộc:

```ts
console.error("[tênAction]", {
  input: { ...parsed.data, password: undefined },  // loại bỏ field nhạy cảm
  error: err,
})
```

- Prefix `[tênAction]` để grep log dễ dàng
- Bao gồm input data đã sanitize — bỏ bất kỳ field nào nhạy cảm: credential (`password`, `token`, `secret`), dữ liệu tài chính nội bộ (`internalCost`, `margin`), thông tin cá nhân (`phone`, `address`)
- `err` object tự mang stack trace — không cần log `err.stack` riêng
- Không log ở client — lỗi đã được log phía server

## Error messages

**Luôn tiếng Việt.** Message dành cho user phải generic — không lộ tên bảng, tên cột, SQL error, stack trace.

```ts
// ✅
return { success: false, error: "Thiết bị này đã tồn tại trong kho.", code: "CONFLICT" }

// ❌ — lộ thông tin nội bộ
return { success: false, error: `duplicate key value violates unique constraint "devices_pkey"`, code: "CONFLICT" }
```

DB constraint violation → message mô tả nghiệp vụ, không mô tả DB:

| Trường hợp | Message |
|-----------|---------|
| Unique violation | Theo context: "Mã phụ tùng này đã tồn tại." |
| Foreign key violation | "Không thể xóa vì còn dữ liệu liên quan." |
| Not found | "Không tìm thấy [tên entity]." |

## Client-side display

Mỗi `ErrorCode` có cách hiển thị riêng:

| ErrorCode | UI |
|-----------|-----|
| `VALIDATION_ERROR` | Inline dưới từng field (dùng `fieldErrors`) |
| `AUTH_ERROR` | Alert + redirect login khi user confirm |
| `NOT_FOUND` | Toast warning |
| `CONFLICT` | Toast warning dùng `error` string; nếu liên quan field cụ thể thì server cũng trả thêm `fieldErrors` để hiển thị inline |
| `INTERNAL_ERROR` | Toast error |

Pattern chuẩn trong client component:

```tsx
const handleSubmit = async (data: FormData) => {
  const result = await createTransaction(data)

  if (!result.success) {
    if (result.code === "VALIDATION_ERROR") {
      setFieldErrors(result.fieldErrors ?? {})
      return
    }
    if (result.code === "AUTH_ERROR") {
      showSessionExpiredAlert()  // alert + redirect khi user confirm
      return
    }
    toast.error(result.error)
    return
  }

  toast.success("Tạo giao dịch thành công")
}
```

### Khi nào dùng alert vs toast

- **Alert** — khi lỗi yêu cầu user phải xác nhận trước khi tiếp tục (block interaction). Hiện tại chỉ có `AUTH_ERROR`.
- **Toast** — mọi lỗi còn lại (non-blocking, tự biến mất).

Nguyên tắc: nếu để user tiếp tục mà không xử lý lỗi sẽ gây mất data hoặc hành động sai → dùng alert. Còn lại → toast.

### Session expired

Khi `code === "AUTH_ERROR"`: hiển thị alert thông báo phiên hết hạn. User nhấn xác nhận → redirect `/login`. **Không tự động redirect** — tránh mất data đang nhập.

### Validation errors

Hiển thị tất cả field errors cùng lúc, không từng cái một:

```tsx
<input name="amount" ... />
{fieldErrors?.amount && (
  <p className="text-sm text-destructive">{fieldErrors.amount[0]}</p>
)}
```

## React Error Boundaries

`error.tsx` bắt lỗi từ Server Component (query fail, unhandled exception trong render). Không cần try/catch trong Server Component — để bubble lên `error.tsx`.

**Bắt buộc** có `src/app/error.tsx` làm global fallback:

```tsx
// src/app/error.tsx
"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <p className="text-destructive">Đã có lỗi xảy ra.</p>
      <button onClick={reset}>Thử lại</button>
    </div>
  )
}
```

**Tùy chọn** thêm `error.tsx` ở feature level khi cần UI riêng:

```
app/(dashboard)/reports/error.tsx
app/(dashboard)/devices/error.tsx
```

## Client fetch (API routes)

Khi fetch từ client component, wrap trong try/catch và map về cùng display pattern:

```ts
try {
  const res = await fetch("/api/transactions?month=2026-01")
  if (!res.ok) {
    toast.error("Không thể tải dữ liệu. Vui lòng thử lại.")
    return
  }
  const data = await res.json()
} catch {
  toast.error("Mất kết nối. Vui lòng kiểm tra mạng.")
}
```
