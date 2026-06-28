# Error Handling

## ActionResult type

```ts
// src/lib/types.ts
// ErrorCode là CONST object (dùng `ErrorCode.X`, KHÔNG hardcode chuỗi) + type cùng tên:
const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR", // Zod fail
  AUTH_ERROR: "AUTH_ERROR", // chưa đăng nhập / sai role / hết hạn (authn + authz)
  NOT_FOUND: "NOT_FOUND", // record không tồn tại
  CONFLICT: "CONFLICT", // duplicate / constraint violation
  INTERNAL_ERROR: "INTERNAL_ERROR", // unexpected (DB crash, network, v.v.)
} as const;
type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

type ActionResult<T = void> =
  | { success: true; data: T }
  | {
      success: false;
      error: string; // message tiếng Việt cho user
      code: ErrorCode; // để client quyết định behavior
      fieldErrors?: Record<string, string[]>; // chỉ có khi code === "VALIDATION_ERROR"
    };
```

## Server Actions — pattern chuẩn

Thứ tự cố định trong mọi action: **auth → validate → execute**.

```ts
// src/app/(dashboard)/transactions/actions.ts
"use server";

export const createTransaction = async (
  input: unknown,
): Promise<ActionResult<{ id: string }>> => {
  // 1. Auth — getCurrentSession (bọc React cache), không gọi auth.api.getSession rải rác.
  const session = await getCurrentSession();
  if (!session) {
    return {
      success: false,
      error: "Phiên đăng nhập đã hết hạn.",
      code: ErrorCode.AUTH_ERROR,
    };
  }

  // 2. Validate — lỗi Zod dùng helper chung zodActionError (z.flattenError, KHÔNG .flatten()).
  const parsed = CreateTransactionSchema.safeParse(input);
  if (!parsed.success) return zodActionError(parsed.error);

  // 3. Execute
  try {
    const [row] = await db
      .insert(transactions)
      .values(parsed.data)
      .returning({ id: transactions.id });
    revalidatePath("/transactions");
    return { success: true, data: { id: row.id } };
  } catch (err) {
    console.error("[createTransaction]", { input: parsed.data, error: err });
    return {
      success: false,
      error: "Đã có lỗi xảy ra. Vui lòng thử lại.",
      code: ErrorCode.INTERNAL_ERROR,
    };
  }
};
```

## Logging

Dùng **`logError`** (ERROR, lỗi không mong đợi) / **`logWarn`** (WARN, lỗi đã xử lý) ([src/lib/logger.ts](../../src/lib/logger.ts)), **KHÔNG** `console.error`. Chi tiết đầy đủ (pino, request-id, log SQL, chia level) ở **[logging.md](./logging.md)**.

```ts
} catch (err) {
  if (err instanceof APIError && err.body?.code === "INVALID_PASSWORD") {
    logWarn("changePassword", err);   // case nghiệp vụ → WARN
    return { success: false, code: ErrorCode.AUTH_ERROR, error: "Mật khẩu hiện tại không đúng." };
  }
  logError("changePassword", err);    // còn lại → ERROR
  return { success: false, code: ErrorCode.INTERNAL_ERROR, error: "Có lỗi xảy ra, thử lại sau." };
}
```

- **Log mọi lỗi, chia level.** Phân biệt `APIError` theo **`err.body?.code`** — không gộp mọi `APIError` về một message.
- Business rejection (`if (!result.ok)`) → `logWarn(action, result.error, { code: result.code })`.
- **Zod field-validation (`zodActionError`) KHÔNG log** — input sai của client, gây nhiễu.
- Action bọc `withActionContext("...")` → log tự có `requestId`/`userId`; tên action phải trùng tên trong `logError`/`logWarn`.
- `extra.input` đã sanitize — bỏ field nhạy cảm: credential (`password`, `token`, `secret`), dữ liệu tài chính nội bộ (`internalCost`, `margin`), PII (`phone`, `address`)
- `err` object tự mang stack trace — không cần log `err.stack` riêng
- Không log ở client — lỗi đã được log phía server

## Error messages

**Luôn tiếng Việt.** Message dành cho user phải generic — không lộ tên bảng, tên cột, SQL error, stack trace.

```ts
// ✅
return {
  success: false,
  error: "Thiết bị này đã tồn tại trong kho.",
  code: "CONFLICT",
};

// ❌ — lộ thông tin nội bộ
return {
  success: false,
  error: `duplicate key value violates unique constraint "devices_pkey"`,
  code: "CONFLICT",
};
```

DB constraint violation → message mô tả nghiệp vụ, không mô tả DB:

| Trường hợp            | Message                                     |
| --------------------- | ------------------------------------------- |
| Unique violation      | Theo context: "Mã phụ tùng này đã tồn tại." |
| Foreign key violation | "Không thể xóa vì còn dữ liệu liên quan."   |
| Not found             | "Không tìm thấy [tên entity]."              |

## Client-side display

Form dùng `useActionState` nên tách lỗi bằng helper chung **`getFormError(state)`** (`src/lib/form.ts`) → `{ fieldErrors, formError }`; field error hiển thị inline qua **`<Field>`**, form error qua `<Alert>`. Không tự viết lại logic tách lỗi ở từng form.

Mỗi `ErrorCode` có cách hiển thị riêng:

| ErrorCode          | UI                                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `VALIDATION_ERROR` | Inline dưới từng field (dùng `fieldErrors`)                                                                             |
| `AUTH_ERROR`       | Alert + redirect login khi user confirm                                                                                 |
| `NOT_FOUND`        | Toast warning                                                                                                           |
| `CONFLICT`         | Toast warning dùng `error` string; nếu liên quan field cụ thể thì server cũng trả thêm `fieldErrors` để hiển thị inline |
| `INTERNAL_ERROR`   | Toast error                                                                                                             |

Pattern chuẩn trong client component:

```tsx
const handleSubmit = async (data: FormData) => {
  const result = await createTransaction(data);

  if (!result.success) {
    if (result.code === "VALIDATION_ERROR") {
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }
    if (result.code === "AUTH_ERROR") {
      showSessionExpiredAlert(); // alert + redirect khi user confirm
      return;
    }
    toast.error(result.error);
    return;
  }

  toast.success("Tạo giao dịch thành công");
};
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
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <p className="text-destructive">Đã có lỗi xảy ra.</p>
      <button onClick={reset}>Thử lại</button>
    </div>
  );
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
  const res = await fetch("/api/transactions?month=2026-01");
  if (!res.ok) {
    toast.error("Không thể tải dữ liệu. Vui lòng thử lại.");
    return;
  }
  const data = await res.json();
} catch {
  toast.error("Mất kết nối. Vui lòng kiểm tra mạng.");
}
```
