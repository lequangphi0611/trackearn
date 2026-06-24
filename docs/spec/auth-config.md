# Spec — Cấu hình Auth & Schema (foundation)

> **Loại:** spec nền tảng, dependency dùng chung cho [screens/register.md](./screens/register.md) & [screens/login.md](./screens/login.md).
> **Tham chiếu:** [architecture.md](../architecture.md) (data model), [coding-rules](../coding-rules.md).
> **Hiện trạng code:**
> - `src/lib/auth.ts`: `betterAuth({ database: drizzleAdapter(db,{provider:"pg"}), emailAndPassword:{enabled:true} })` — **thiếu** `nextCookies`, `additionalFields.role`, `session`.
> - `src/db/schema.ts`: rỗng. `drizzle.config.ts` trỏ `./src/db/schema.ts`, out `./drizzle`, postgresql.
> - `.env`: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.

---

## 1. Mục đích & phạm vi

Định nghĩa cấu hình Better Auth và schema DB tối thiểu để 2 màn auth chạy được:
- `src/lib/auth.ts` đầy đủ (role, session, cookie cho Server Actions).
- Bảng DB của Better Auth (`user`, `session`, `account`, `verification`) + cột `role`.
- Query `ownerExists()` và các script DB.

Ngoài phạm vi: các bảng nghiệp vụ (transactions, devices, debts…) — thuộc spec schema riêng.

---

## 2. `src/lib/auth.ts`

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "member", input: true },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 ngày
    updateAge: 60 * 60 * 24,      // 1 ngày (sliding)
    cookieCache: { enabled: true, maxAge: 60 * 5 }, // cache 5 phút
  },
  plugins: [
    admin({ adminRoles: ["owner"] }), // quản lý người dùng (xem screens/settings.md)
    nextCookies(),                    // PHẢI là plugin cuối
  ],
});
```

**Điểm bắt buộc:**
- `nextCookies()` **phải đứng cuối** mảng `plugins`. Thiếu nó → Server Action `signUpEmail`/`signInEmail` không set được cookie → đăng nhập "thành công" nhưng không có session.
- **Admin plugin** (`better-auth/plugins`): cho owner quản lý member (`createUser`, `setUserPassword`, `banUser`/`unbanUser`, `removeUser`); bổ sung field `banned`/`banReason`/`banExpires` vào `user`. `adminRoles: ["owner"]` → owner là admin.
- `minPasswordLength: 8` khớp validation màn register.
- `role` dùng `input: true` để register truyền `role:"owner"`; mặc định `"member"`.

---

## 3. Schema DB — `src/db/schema.ts`

Better Auth cần 4 bảng. **Cách tạo:** chạy Better Auth CLI sinh schema Drizzle rồi chỉnh:

```bash
npx @better-auth/cli@latest generate   # sinh định nghĩa bảng vào schema.ts
```

Bảng & cột tối thiểu (tóm tắt — CLI sinh chi tiết):

| Bảng | Cột chính |
|------|-----------|
| `user` | `id`, `name`, `email` (unique), `emailVerified`, `image`, **`role`** (text, default `'member'`), **`banned`** (bool), **`banReason`**, **`banExpires`** (do admin plugin thêm), `createdAt`, `updatedAt` |
| `session` | `id`, `userId`→user, `token`, `expiresAt`, `ipAddress`, `userAgent`, `createdAt`, `updatedAt` |
| `account` | `id`, `userId`→user, `accountId`, `providerId`, `password` (hash), `createdAt`, `updatedAt` |
| `verification` | `id`, `identifier`, `value`, `expiresAt`, `createdAt`, `updatedAt` |

> Cột `role` đến từ `additionalFields` — CLI tự thêm khi đọc config `auth.ts`. Nếu thêm tay: `role: text("role").notNull().default("member")`.
> `schema.ts` phải **export đủ 4 bảng** với đúng tên (`user`, `session`, `account`, `verification`) để `db.query.user` (relational API) và `drizzleAdapter` map đúng.
>
> **Về "chống race" ở register:** không cần lock/transaction phức tạp. `email` có **unique constraint** (đăng ký trùng → lỗi `CONFLICT`); việc 2 người cùng tạo owner trong tích tắc gần như không xảy ra với hộ gia đình. `ownerExists()` gọi lại trong action là lớp chặn đủ tốt; cực đoan có thể thêm partial unique index "chỉ 1 owner" sau.

---

## 4. Scripts DB — `package.json`

Thêm:

```json
"scripts": {
  "auth:generate": "npx @better-auth/cli@latest generate",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:push": "drizzle-kit push"
}
```

Quy trình thiết lập: `auth:generate` → `db:generate` (sinh migration SQL trong `./drizzle`) → `db:migrate` (áp vào DB). Dev nhanh có thể `db:push`.

---

## 5. Query `ownerExists()` — `src/queries/users.ts`

```ts
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function ownerExists(): Promise<boolean> {
  const row = await db.query.user.findFirst({ where: eq(user.role, "owner") });
  return Boolean(row);
}
```

Dùng ở: `register` (mở/khoá + chống race), `login` (ẩn/hiện link Đăng ký).

---

## 6. Biến môi trường

| Biến | Vai trò |
|------|---------|
| `DATABASE_URL` | Kết nối PostgreSQL (đã có) |
| `BETTER_AUTH_SECRET` | Khóa ký session/cookie — **đổi ở production** |
| `BETTER_AUTH_URL` | Base URL app (vd `http://localhost:3000`) |

---

## 7. Acceptance criteria

- [ ] `auth.ts` có `nextCookies()` cuối plugins, `additionalFields.role`, `session` 30 ngày, `minPasswordLength: 8`.
- [ ] Chạy `db:generate` + `db:migrate` tạo 4 bảng (`user` có cột `role` default `member`).
- [ ] Đăng ký/đăng nhập set được cookie session (nhờ `nextCookies`).
- [ ] `ownerExists()` trả `true` sau khi có 1 user role=`owner`, `false` khi DB trống.
- [ ] `drizzleAdapter` nhận `schema` để map đúng bảng.

---

## 8. Điểm chưa chốt

- Có dùng **email verification** không → mặc định **tắt** (`emailAndPassword` không bật `requireEmailVerification`). Cân nhắc sau.
- Bảng nghiệp vụ (transactions, devices, debts, spare_parts, repair_jobs…) — spec schema riêng, tham chiếu data model trong `architecture.md`.
