# Spec màn hình — Login (`/login`)

> **Loại:** spec chi tiết cho 1 màn hình, làm đầu bài cho AI/dev implement.
> **Tham chiếu:** tổng quan [../screens.md](../screens.md) · màn đăng ký [./register.md](./register.md) · data model [../../architecture.md](../../architecture.md) · [coding-rules](../../coding-rules.md).
> **Hiện trạng code:** `src/lib/auth.ts` đã bật Better Auth `emailAndPassword`; `src/lib/types.ts` có `ActionResult<T>`. Chính sách session (30 ngày) định nghĩa ở [register.md mục 8.1](./register.md#8-phụ-thuộc-cần-làm-trướckèm-theo) — **dùng chung**.

---

## 1. Mục đích & phạm vi

Màn đăng nhập cho người dùng đã có tài khoản (owner hoặc member) bằng **email + mật khẩu**.

- Là **điểm vào mặc định** của app khi chưa có session.
- Không tạo tài khoản tại đây (owner tạo ở `/register`, member do owner tạo ở `/settings/users`).
- **Không có** chức năng "quên mật khẩu" self-serve ở giai đoạn này (xem mục 10).

---

## 2. Route & quyền truy cập

| Thuộc tính | Giá trị |
|------------|---------|
| Route | `/login` (nhận query `?callbackURL=<path>`) |
| Thư mục | `src/app/(auth)/login/page.tsx` |
| Quyền | Công khai |
| Khi đã đăng nhập | Redirect về `/` (không cho vào trang auth). |

---

## 3. Điều kiện hiển thị

`page.tsx` là **Server Component**:

1. Lấy session: `auth.api.getSession({ headers: await headers() })`. Nếu **có session** → `redirect("/")`.
2. Ngược lại render **form đăng nhập** (client component `login-form.tsx` trong cùng thư mục; dùng shadcn `Card`, `Input`, `Button`, `Alert`).
3. Gọi `ownerExists()` để quyết định có hiện link "Đăng ký" hay không (mục 4) — chỉ hiện khi **chưa có owner**.

---

## 4. Giao diện (UI)

Mobile-first, căn giữa, shadcn/ui, `Card` rộng tối đa `max-w-sm`.

| Field | Label | Input |
|-------|-------|-------|
| `email` | Email | email, required |
| `password` | Mật khẩu | password, required |

- Nút submit: **"Đăng nhập"** — trạng thái loading (disable + spinner) khi đang gửi.
- **Không** có checkbox "Ghi nhớ đăng nhập" (session mặc định đã 30 ngày).
- Lỗi sai thông tin đăng nhập → **Alert** phía trên form: *"Email hoặc mật khẩu không đúng."* (chung chung, không tiết lộ sai cái nào).
- Lỗi field rỗng/sai định dạng → inline dưới input (từ `fieldErrors`).
- Link "Đăng ký" → `/register`: **chỉ hiển thị khi `ownerExists() === false`**.
- Không có link "Quên mật khẩu" (giai đoạn này).

---

## 5. Validation (Zod)

Schema tại `src/app/(auth)/login/schema.ts`:

| Field | Rule | Thông báo lỗi (vi) |
|-------|------|--------------------|
| `email` | email hợp lệ; **transform** `.trim().toLowerCase()` | "Email không hợp lệ" |
| `password` | không rỗng | "Vui lòng nhập mật khẩu" |

> Không enforce độ dài mật khẩu ở login (chỉ kiểm tra rỗng) — việc xác thực đúng/sai do Better Auth đảm nhận.

---

## 6. Luồng xử lý — Server Action

File: `src/app/(auth)/login/actions.ts` (`"use server"`), export `login(prevState, formData)` trả `ActionResult<{ redirectTo: string }>`. Client gọi qua `useActionState` (giá trị khởi tạo `prevState = null`) + `useFormStatus`.

> **Shape `ActionResult<T>`** (đã có ở `src/lib/types.ts`):
> `{ success:true; data:T } | { success:false; error:string; code:ErrorCode; fieldErrors?:Record<string,string[]> }`.

1. Parse `FormData` qua Zod. Lỗi → `{ success:false, code:"VALIDATION_ERROR", error:"Dữ liệu không hợp lệ", fieldErrors }`.
2. Xác định đích điều hướng từ `callbackURL`:
   - **Chỉ chấp nhận path nội bộ**: phải bắt đầu bằng đúng **một** dấu `/`, **không** bắt đầu bằng `//` hoặc `/\` (chống `//evil.com`, `/\evil.com`), không chứa ký tự xuống dòng, không phải URL tuyệt đối — chống **open redirect**.
   - Không hợp lệ → fallback `"/"`.
3. Đăng nhập trong `try/catch`: `auth.api.signInEmail({ body: { email, password }, headers: await headers() })`.
   - `headers` từ `next/headers` (để Better Auth set cookie session theo chính sách session chung).
   - Better Auth **ném `APIError`** khi sai thông tin → `catch` và trả `{ success:false, code:"AUTH_ERROR", error:"Email hoặc mật khẩu không đúng." }`.
4. Lỗi khác (không phải sai thông tin đăng nhập) → `console.error(...)` + `{ success:false, code:"INTERNAL_ERROR", error:"Có lỗi xảy ra, thử lại sau." }`.
5. Thành công → `{ success:true, data: { redirectTo } }`.

> **Điều hướng:** action **không** `redirect()`. Client theo dõi `useActionState`, khi `success === true` thì `router.push(data.redirectTo)`.

---

## 7. Trạng thái & phản hồi

| Tình huống | Phản hồi UI |
|------------|-------------|
| Đang submit | nút loading, disable form |
| `VALIDATION_ERROR` | lỗi inline theo `fieldErrors` |
| `AUTH_ERROR` (sai thông tin) | Alert chung "Email hoặc mật khẩu không đúng." |
| `INTERNAL_ERROR` | Alert "Có lỗi xảy ra, thử lại sau" |
| `success` | điều hướng tới `redirectTo` (mặc định `/`) |

---

## 8. Phụ thuộc (cần làm trước/kèm theo)

1. **Cấu hình session** — `src/lib/auth.ts` theo [register.md mục 8.1](./register.md) (expiresIn 30 ngày, updateAge 1 ngày, cookieCache). Dùng chung, không lặp lại.
2. **`ownerExists()`** — `src/queries/users.ts` (đã dùng ở register).
3. **Rate-limit / chống brute-force** — dùng **built-in của Better Auth** (bật mặc định: giới hạn số request theo cửa sổ thời gian). Không cần cấu hình thêm ở giai đoạn này; cân nhắc siết riêng cho endpoint sign-in sau.
4. **Middleware** — chuyển hướng người chưa đăng nhập về `/login?callbackURL=<path hiện tại>`.
5. Liên quan: `/register`, `/settings/users` (owner reset mật khẩu member), `/` (đích mặc định).

---

## 9. Acceptance criteria

- [ ] Vào `/login` (chưa đăng nhập) thấy form email + mật khẩu, không có "ghi nhớ", không có "quên mật khẩu".
- [ ] Đăng nhập đúng → tạo session, điều hướng tới `callbackURL` (hoặc `/` nếu không có/không hợp lệ).
- [ ] Đăng nhập sai → Alert chung "Email hoặc mật khẩu không đúng.", không lộ sai email hay sai mật khẩu.
- [ ] Field rỗng/email sai định dạng → lỗi inline, không gọi server.
- [ ] `callbackURL` là URL ngoài (vd `https://evil.com`) → bị bỏ qua, về `/` (không open redirect).
- [ ] Chưa có owner → hiện link "Đăng ký"; đã có owner → ẩn link.
- [ ] Đã đăng nhập mà vào `/login` → redirect `/`.
- [ ] Responsive tốt trên mobile.

---

## 10. Điểm chưa chốt

- **Quên mật khẩu**: chưa có self-serve (cần hạ tầng gửi email). Tạm thời: **owner reset mật khẩu member** ở `/settings/users`; nếu **owner quên** → team dev reset thủ công (DB / script). Cân nhắc bổ sung luồng reset qua email sau.
