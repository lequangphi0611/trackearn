# Spec — Middleware phân quyền (foundation)

> **Loại:** spec nền tảng, dependency dùng chung cho các màn sau login.
> **Tham chiếu:** [auth-config.md](./auth-config.md), [screens/login.md](./screens/login.md), ma trận phân quyền trong [screens.md](./screens.md).
> **Hiện trạng code:** chưa có `src/middleware.ts`.

---

## 1. Mục đích & phạm vi

Bảo vệ route ở tầng edge (Next.js middleware):
- Chặn người **chưa đăng nhập** vào các trang trong app → đẩy về `/login` kèm `callbackURL`.
- Đẩy người **đã đăng nhập** ra khỏi trang auth (`/login`, `/register`) → về `/`.

**Quan trọng — ranh giới trách nhiệm:** Middleware chỉ kiểm tra **có session hay không** (optimistic, đọc cookie, không gọi DB). **Phân quyền theo role** (owner-only `/reports`, `/settings/users`) **KHÔNG** đặt ở middleware mà ở **layout/page server component** của nhóm route đó (xem mục 5) — vì cần xác thực role chuẩn từ session/DB, tránh gọi DB ở edge.

---

## 2. File & cấu hình — `src/middleware.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const AUTH_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(getSessionCookie(request)); // chỉ kiểm tra cookie, không query DB

  const isAuthRoute = AUTH_ROUTES.includes(pathname); // khớp chính xác, tránh match /login-help

  // Đã đăng nhập mà vào trang auth → về dashboard
  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Chưa đăng nhập mà vào trang được bảo vệ → về login kèm callbackURL
  if (!hasSession && !isAuthRoute) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackURL", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Bỏ qua TOÀN BỘ /api (tự lo auth, trả JSON — không redirect HTML), asset Next, file tĩnh
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|icons).*)",
  ],
};
```

> `getSessionCookie` chỉ đọc **sự tồn tại** của cookie session (edge-safe, không DB). Đây là kiểm tra **optimistic** — xác thực thật do server component thực hiện khi render.

---

## 3. Phân loại route

| Loại | Ví dụ | Hành vi middleware |
|------|-------|--------------------|
| Auth (công khai) | `/login`, `/register` | Chưa login: cho vào. Đã login: redirect `/`. |
| Được bảo vệ | `/`, `/transactions/*`, `/devices/*`, `/debts/*`, `/reports`, `/settings/*`… | Chưa login: redirect `/login?callbackURL=…`. Đã login: cho qua (role check ở server). |
| Loại trừ matcher | `/api/*` (toàn bộ), `_next/*`, file tĩnh | Không chạy middleware. API tự xử lý auth & trả JSON, không bị redirect sang HTML login. |

---

## 4. `callbackURL`

- Tạo từ `pathname + search` của request bị chặn → gắn vào `/login?callbackURL=…`.
- Màn Login chịu trách nhiệm **validate** giá trị này trước khi điều hướng (chống open-redirect) — xem [login.md mục 6](./screens/login.md).

---

## 5. Phân quyền theo role (ở server, KHÔNG ở middleware)

Owner-only route được gác tại **layout/page server component**:

- `/reports` và `/settings/users`: trong server component, lấy session
  `const session = await auth.api.getSession({ headers: await headers() })`,
  nếu `session.user.role !== "owner"` → `redirect("/")` (hoặc trang 403).
- Dashboard hiển thị bản rút gọn cho `member` cũng dựa trên `session.user.role` ở server.

> Lý do tách: role là dữ liệu cần xác thực chuẩn; đọc ở edge dễ lỗi thời/khó truy DB. (Tương lai có thể optimistic-check role qua `cookieCache` trong middleware để chặn sớm — xem mục 7.)

---

## 6. Acceptance criteria

- [ ] Chưa đăng nhập vào `/` hay `/transactions/...` → redirect `/login?callbackURL=<path đã ghé>`.
- [ ] Đã đăng nhập vào `/login` hoặc `/register` → redirect `/`.
- [ ] `/api/auth/*` và asset tĩnh không bị middleware can thiệp.
- [ ] `member` truy cập `/reports` hoặc `/settings/users` → bị **server component** redirect `/` (không phải middleware).
- [ ] Sau khi login, được đưa về đúng `callbackURL` (đã validate ở login).

---

## 7. Điểm chưa chốt

- **Optimistic role-gating ở middleware** qua `cookieCache` (đọc role từ session cache trong cookie) để chặn sớm owner-only route → cân nhắc thêm sau; hiện đủ với gác ở server.
- **Trang 403** riêng cho truy cập trái quyền, hay chỉ `redirect("/")` → tạm dùng redirect `/`.
