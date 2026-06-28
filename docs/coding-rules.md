# Coding Rules

Bộ quy tắc cho toàn bộ codebase TrackEarn. **Đọc trước khi implement bất kỳ đoạn code nào.**

## Danh sách rules

| File | Nội dung |
|------|---------|
| [naming.md](./rules/naming.md) | Đặt tên file, function, type, biến, DB schema |
| [folder-structure.md](./rules/folder-structure.md) | Feature-based structure, nơi đặt queries/actions/components |
| [data-model.md](./rules/data-model.md) | **Schema & nghiệp vụ**: tiền `bigint` đồng, `timestamptz`+giờ VN, `payment_status` suy ra, công nợ 1:1, khóa `transaction→debt`, audit — **đọc trước khi chạm DB** |
| [typescript.md](./rules/typescript.md) | `type` vs `interface`, hạn chế `any`, return types |
| [components.md](./rules/components.md) | `export const`, `"use client"` placement, khi nào tách component |
| [data-fetching.md](./rules/data-fetching.md) | Server fetch ưu tiên, `src/queries/`, Suspense, khi nào client fetch |
| [server-actions.md](./rules/server-actions.md) | `ActionResult<T>`, Zod validation, auth check, file placement |
| [state.md](./rules/state.md) | RSC + revalidate, useState scope, Zustand, URL state |
| [performance.md](./rules/performance.md) | `next/image` + sizes, lazy load, N+1 queries |
| [ui-design.md](./rules/ui-design.md) | Color tokens, typography scale, spacing, breakpoints, component conventions |
| [error-handling.md](./rules/error-handling.md) | ActionResult + ErrorCode, logging, toast/inline/alert, error.tsx |
| [logging.md](./rules/logging.md) | **pino, log SQL theo env, request-id (AsyncLocalStorage), `logError`, `withActionContext`** |
| [commits.md](./rules/commits.md) | `feat:` / `fix:` / `chore:` convention |

## Quyết định nhanh

**Tôi cần fetch data** → Server Component + query trong `src/queries/` → [data-fetching.md](./rules/data-fetching.md)

**Tôi cần ghi DB** → Server Action trong `feature/actions.ts`, trả về `ActionResult<T>` → [server-actions.md](./rules/server-actions.md). Quy ước schema/nghiệp vụ (tiền, timezone, khóa, công nợ) → [data-model.md](./rules/data-model.md)

**Tôi cần API route** → chỉ khi client fetch, webhook, hoặc file export → [data-fetching.md](./rules/data-fetching.md)

**Tôi cần state** → URL state trước → `useState` → Zustand → [state.md](./rules/state.md)

**Tôi cần thêm image** → `next/image` + khai báo `sizes` → [performance.md](./rules/performance.md)
