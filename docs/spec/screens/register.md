# Spec màn hình — Register (`/register`)

> **Loại:** spec chi tiết cho 1 màn hình, làm đầu bài cho AI/dev implement.
> **Tham chiếu:** tổng quan màn hình [../screens.md](../screens.md) · data model [../../architecture.md](../../architecture.md) · [coding-rules](../../coding-rules.md).
> **Hiện trạng code:** `src/lib/auth.ts` đã bật Better Auth `emailAndPassword` (Drizzle pg adapter) nhưng **chưa có `role`**; `src/db/schema.ts` còn rỗng; `src/lib/types.ts` đã có `ActionResult<T>`.

---

## 1. Mục đích & phạm vi

Màn đăng ký tài khoản **chủ hộ (owner)** đầu tiên của hệ thống.

- Chỉ dùng để **khởi tạo owner lần đầu**. Khi hệ thống đã có owner → màn này **khoá**.
- **Không bao giờ** tạo tài khoản `member` ở đây — member do owner tạo trong `/settings/users`.

---

## 2. Route & quyền truy cập

| Thuộc tính | Giá trị |
|------------|---------|
| Route | `/register` |
| Thư mục | `src/app/(auth)/register/page.tsx` |
| Quyền | Công khai — chỉ khi **chưa có owner**. Đã có owner → khoá. |
| Khi đã đăng nhập | Redirect về `/` (không cho vào trang auth). |

---

## 3. Điều kiện hiển thị (mở / khoá)

`page.tsx` là **Server Component**, kiểm tra trước khi render:

1. Nếu **đã có session** → `redirect("/")`.
2. Gọi query `ownerExists()` — đếm xem trong bảng `users` đã có bản ghi `role = "owner"` chưa.
   - `ownerExists() === true` → render **màn thông báo khoá** (mục 4.2), KHÔNG render form.
   - `ownerExists() === false` → render **form đăng ký** (mục 4.1).

> Query đặt tại `src/queries/users.ts`, trả `boolean`.

---

## 4. Giao diện (UI)

Mobile-first, căn giữa, dùng shadcn/ui. Container `Card` rộng tối đa `max-w-sm`.

### 4.1. Form đăng ký (khi chưa có owner)

| Field | Label | Input | Ghi chú UI |
|-------|-------|-------|-----------|
| `name` | Họ tên | text | required |
| `email` | Email | email | required |
| `password` | Mật khẩu | password | **hint hiển thị**: "Tối thiểu 8 ký tự" |
| `confirmPassword` | Nhập lại mật khẩu | password | required |

- Nút submit: **"Tạo tài khoản chủ hộ"** — có trạng thái loading (disable + spinner) khi đang gửi.
- Lỗi từng field hiển thị **inline** dưới input (từ `fieldErrors`).
- Lỗi cấp form (vd email trùng, hệ thống) hiển thị **Alert** phía trên form.
- Link phụ: "Đã có tài khoản? **Đăng nhập**" → `/login`.

### 4.2. Màn thông báo khoá (khi đã có owner)

- Thông báo: **"Đã có chủ tài khoản. Liên hệ chủ hộ để được cấp tài khoản."**
- Nút/link: **"Đăng nhập"** → `/login`.
- Không hiển thị form.

---

## 5. Validation (Zod)

Schema tại `src/app/(auth)/register/schema.ts`:

| Field | Rule | Thông báo lỗi (vi) |
|-------|------|--------------------|
| `name` | string, trim, 2–50 ký tự | "Họ tên từ 2 đến 50 ký tự" |
| `email` | email hợp lệ, lowercase | "Email không hợp lệ" |
| `password` | tối thiểu 8 ký tự | "Mật khẩu tối thiểu 8 ký tự" |
| `confirmPassword` | khớp `password` (`.refine`) | "Mật khẩu nhập lại không khớp" |

Validate **cả client (UX nhanh) và server (bắt buộc)**. Server là nguồn chân lý.

---

## 6. Luồng xử lý — Server Action

File: `src/app/(auth)/register/actions.ts` (`"use server"`), export `registerOwner(prevState, formData)` trả `ActionResult<void>`. Client gọi qua `useActionState` (React 19) + `useFormStatus` cho trạng thái loading.

> **Shape `ActionResult<T>`** (đã có ở `src/lib/types.ts`):
> `{ success:true; data:T } | { success:false; error:string; code:ErrorCode; fieldErrors?:Record<string,string[]> }`.

1. Parse `FormData` qua Zod schema. Lỗi → `{ success:false, code:"VALIDATION_ERROR", error:"Dữ liệu không hợp lệ", fieldErrors }`.
2. Gọi lại `ownerExists()` (chống race / bypass). Nếu `true` → `{ success:false, code:"AUTH_ERROR", error:"Đã có chủ tài khoản." }`.
3. Tạo user **và gán role ngay trong 1 lần gọi** (đảm bảo atomic — không tách 2 bước):
   `auth.api.signUpEmail({ body: { name, email, password, role: "owner" }, headers: await headers() })`.
   - `headers` lấy từ `next/headers` (để Better Auth set cookie session).
   - `role` truyền được nhờ khai báo `additionalFields.role` với `input: true` (xem mục 8.1).
   - Better Auth tự **tạo session (đăng nhập ngay)** sau signup — session này theo **chính sách session chung** (30 ngày, sliding 7 ngày; xem mục 8.1).
   - Email đã tồn tại → bắt lỗi, trả `{ success:false, code:"CONFLICT", error:"Email đã được sử dụng." }`.
4. Lỗi không lường trước → `console.error(...)` + `{ success:false, code:"INTERNAL_ERROR", error:"Có lỗi xảy ra, thử lại sau." }`.
5. Thành công → `{ success:true, data: undefined }`.

> **Điều hướng:** action **không** `redirect()` (để client còn nhận `success` + cookie session đã set). Client component theo dõi kết quả `useActionState`, khi `success === true` thì `router.push("/")`.

---

## 7. Trạng thái & phản hồi

| Tình huống | Phản hồi UI |
|------------|-------------|
| Đang submit | nút loading, disable form |
| `VALIDATION_ERROR` | lỗi inline theo `fieldErrors` |
| `CONFLICT` (email trùng) | Alert trên form |
| `AUTH_ERROR` (đã có owner) | Alert + gợi ý sang `/login` |
| `INTERNAL_ERROR` | Alert "Có lỗi xảy ra, thử lại sau" |
| `success` | tự đăng nhập → chuyển `/` |

---

## 8. Phụ thuộc (cần làm trước/kèm theo)

1. **`role` cho user** — `src/lib/auth.ts` thêm `user.additionalFields.role`:
   ```ts
   user: { additionalFields: { role: {
     type: "string", required: false, defaultValue: "member", input: true,
   } } }
   ```
   `input: true` cho phép truyền `role` vào `signUpEmail` (register set `"owner"`). Các nơi khác tạo user mặc định `"member"`.

   **Chính sách session (dùng chung cho mọi đường tạo session — register auto-login & login):**
   ```ts
   session: {
     expiresIn: 60 * 60 * 24 * 30, // 30 ngày — tuổi thọ tối đa
     updateAge: 60 * 60 * 24 * 7,  // 7 ngày — sliding: gia hạn khi hoạt động
     cookieCache: { enabled: true, maxAge: 60 * 5 }, // cache 5 phút, giảm query DB
   }
   ```
2. **`src/db/schema.ts`** — định nghĩa bảng `users` (+ các bảng Better Auth: session, account, verification) kèm cột `role`.
3. **`ownerExists()`** — `src/queries/users.ts`.
4. Liên quan: `/login` (đích điều hướng), `/settings/users` (nơi tạo member).

---

## 9. Acceptance criteria

- [ ] Chưa có owner: vào `/register` thấy form 4 trường + hint mật khẩu.
- [ ] Submit hợp lệ → tạo user role=`owner`, **tự đăng nhập**, chuyển về `/`.
- [ ] Mật khẩu < 8 ký tự / nhập lại không khớp → lỗi inline, không gọi server thành công.
- [ ] Email trùng → báo lỗi `CONFLICT` rõ ràng.
- [ ] Đã có owner: vào `/register` thấy **màn thông báo khoá** + link `/login`, không có form.
- [ ] Đang đăng nhập mà vào `/register` → redirect `/`.
- [ ] Responsive tốt trên mobile.

---

## 10. Điểm chưa chốt

- Có cần **xác thực email** (email verification) cho owner không? → Mặc định **không** (hộ gia đình). Ghi nhận để cân nhắc sau.
