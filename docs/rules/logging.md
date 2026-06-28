# Logging

Quan sát hệ thống: **thấy SQL nào được chạy**, **log lỗi có cấu trúc**, và **nối các log của cùng một request** lại với nhau. Liên quan chặt với [error-handling.md](./error-handling.md).

## Công cụ

**pino** (in-process — KHÔNG external logging service, đúng [tech-stack.md](../tech-stack.md)).

- **Dev**: `pino-pretty` — log màu, dễ đọc bằng mắt.
- **Prod**: JSON 1 dòng ra **stdout** → Docker Compose tự thu (`docker logs`). Không ghi file.

pino + transport phải nằm trong `serverExternalPackages` của [next.config.ts](../../next.config.ts) (nếu không worker thread của pino-pretty không resolve được module → lỗi "unable to determine transport target").

## Request context (request-id)

Mỗi server action chạy trong một context ([src/lib/request-context.ts](../../src/lib/request-context.ts)) giữ `{ requestId, action, userId }` qua `AsyncLocalStorage`. Logger SQL và `logError` **tự đọc** context — không truyền tay. Nhờ đó grep theo `requestId` nối được toàn bộ log (action + các SQL của nó) của một request.

### Bọc action

Mọi server action export qua **`withActionContext`** ([src/lib/action-context.ts](../../src/lib/action-context.ts)), và gọi **`setUserId`** ngay sau khi có session:

```ts
export const createTransaction = withActionContext(
  "createTransaction",
  async (_prev, formData): Promise<ActionResult<{ id: string }>> => {
    const session = await getCurrentSession();
    if (!session)
      return {
        success: false,
        code: ErrorCode.AUTH_ERROR,
        error: "Chưa đăng nhập.",
      };
    setUserId(session.user.id); // enrich context cho mọi log sau đó
    // ...
  },
);
```

- Tên action trong `withActionContext("...")` **phải trùng** tên dùng trong `logError("...")` để dễ trace.
- Action pre-auth (login, register) vẫn bọc `withActionContext` nhưng không có `setUserId`.

## Log SQL — theo môi trường

SQL được log bằng cách bọc client postgres-js trong [src/db/logger.ts](../../src/db/logger.ts) (`instrumentClient`), gắn ở [src/db/index.ts](../../src/db/index.ts). Quy tắc:

| Môi trường | Log gì                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| **Dev**    | **Mọi** query: `sql` + `params` + `durationMs` (level `debug`)                                                |
| **Prod**   | **Chỉ** query **chậm** (`> SLOW_QUERY_MS`, level `warn`) hoặc **lỗi** (level `error`). **KHÔNG** kèm `params` |

Lý do prod không log params: params chứa **số tiền, SĐT, hash mật khẩu** → tránh lộ dữ liệu tài chính/PII vào log.

> Vì sao bọc client thay vì dùng Drizzle `Logger`: `Logger.logQuery` được gọi _trước_ khi query chạy nên không có duration → không phát hiện được query chậm. Bọc client cho phép đo thời gian quanh promise. Đây là phần tinh tế — đọc comment trong file trước khi sửa.

## Log lỗi — `logError` / `logWarn`

**Không dùng `console.error`.** **Log MỌI lỗi**, nhưng **chia level** để vẫn lọc được:

| Loại lỗi                                                                            | Helper                            | Level     |
| ----------------------------------------------------------------------------------- | --------------------------------- | --------- |
| Không mong đợi (exception lạ, DB lỗi)                                               | `logError(action, err, extra?)`   | **ERROR** |
| Đã xử lý / biết trước (`APIError` đúng case, business rejection NOT_FOUND/CONFLICT) | `logWarn(action, reason, extra?)` | **WARN**  |

Cả hai ở [src/lib/logger.ts](../../src/lib/logger.ts), tự gắn context (requestId/userId).

```ts
} catch (err) {
  // Phân biệt APIError theo err.body.code — KHÔNG gộp mọi APIError về 1 message.
  if (err instanceof APIError && err.body?.code === "INVALID_EMAIL_OR_PASSWORD") {
    logWarn("login", err);                       // case nghiệp vụ → WARN
    return { success: false, code: ErrorCode.AUTH_ERROR, error: "Email hoặc mật khẩu không đúng." };
  }
  logError("login", err);                         // APIError lạ / lỗi khác → ERROR
  return { success: false, code: ErrorCode.INTERNAL_ERROR, error: "Có lỗi xảy ra, thử lại sau." };
}

// Business rejection trả qua ActionResult → WARN kèm code:
if (!result.ok) {
  logWarn("updateTransaction", result.error, { code: result.code, input: { id: data.id } });
  return { success: false, code: result.code, error: result.error };
}
```

- **`APIError` của better-auth phải phân biệt theo `err.body?.code`** (vd `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL`, `INVALID_EMAIL_OR_PASSWORD`, `INVALID_PASSWORD`). Gộp tất cả `instanceof APIError` về một message vừa **sai** (báo nhầm) vừa **nuốt** lỗi thật ở mức WARN.
- **Ngoại lệ — Zod field-validation (`zodActionError`) KHÔNG log**: đó là input sai của client, log sẽ nhiễu vô ích.
- `err` object tự mang stack trace (pino serializer) — không log `err.stack` riêng.
- `extra.input` phải **sanitize**: chỉ field cần để debug, **bỏ** credential (`password`, `token`, `secret`), dữ liệu tài chính nội bộ, PII (`phone`, `address`). pino `redact` chỉ là lưới an toàn cuối.
- Không log ở client — lỗi đã được log phía server.

## Env

| Biến            | Mặc định                      | Ý nghĩa                                                                                   |
| --------------- | ----------------------------- | ----------------------------------------------------------------------------------------- |
| `LOG_LEVEL`     | `debug` (dev) / `info` (prod) | Ngưỡng level pino                                                                         |
| `SLOW_QUERY_MS` | `200`                         | Ngưỡng (ms) coi query là chậm ở prod ([src/lib/constants.ts](../../src/lib/constants.ts)) |

## Kiểm tra nhanh

- Dev: thao tác 1 lần → console hiện dòng `query` (SQL + params) và log action **cùng `requestId`**.
- Prod (`NODE_ENV=production`): log là JSON 1 dòng; query thường **không** xuất hiện, chỉ query `>200ms` / lỗi mới log, **không** có params.
