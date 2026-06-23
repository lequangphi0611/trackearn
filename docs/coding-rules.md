# Coding Rules

Bộ quy tắc cho toàn bộ codebase TrackEarn. **Đọc trước khi implement bất kỳ đoạn code nào.**

## Danh sách rules

| File | Nội dung |
|------|---------|
| [naming.md](./rules/naming.md) | Đặt tên file, function, type, biến, DB schema |
| [folder-structure.md](./rules/folder-structure.md) | Feature-based structure, nơi đặt queries/actions/components |
| [typescript.md](./rules/typescript.md) | `type` vs `interface`, hạn chế `any`, return types |
| [components.md](./rules/components.md) | `export const`, `"use client"` placement, khi nào tách component |
| [data-fetching.md](./rules/data-fetching.md) | Server fetch ưu tiên, `src/queries/`, Suspense, khi nào client fetch |
| [server-actions.md](./rules/server-actions.md) | `ActionResult<T>`, Zod validation, auth check, file placement |
| [state.md](./rules/state.md) | RSC + revalidate, useState scope, Zustand, URL state |
| [performance.md](./rules/performance.md) | `next/image` + sizes, lazy load, N+1 queries |
| [ui-design.md](./rules/ui-design.md) | Color tokens, typography scale, spacing, breakpoints, component conventions |
| [error-handling.md](./rules/error-handling.md) | ActionResult + ErrorCode, logging, toast/inline/alert, error.tsx |
| [commits.md](./rules/commits.md) | `feat:` / `fix:` / `chore:` convention |

## Quyết định nhanh

**Tôi cần fetch data** → Server Component + query trong `src/queries/` → [data-fetching.md](./rules/data-fetching.md)

**Tôi cần ghi DB** → Server Action trong `feature/actions.ts`, trả về `ActionResult<T>` → [server-actions.md](./rules/server-actions.md)

**Tôi cần API route** → chỉ khi client fetch, webhook, hoặc file export → [data-fetching.md](./rules/data-fetching.md)

**Tôi cần state** → URL state trước → `useState` → Zustand → [state.md](./rules/state.md)

**Tôi cần thêm image** → `next/image` + khai báo `sizes` → [performance.md](./rules/performance.md)
