# Spec màn hình — Cài đặt (`/settings`)

> **Loại:** spec chi tiết màn cài đặt + quản lý người dùng, đầu bài cho AI/dev implement.
> **Tham chiếu:** [../screens.md](../screens.md), [auth-config.md](../auth-config.md), [middleware.md](../middleware.md), [transactions-and-debts.md](../transactions-and-debts.md), [coding-rules](../../coding-rules.md).
> **Quyết định nền:** 2 role `owner`/`member`; member do owner tạo; mật khẩu min 8; mọi giao dịch ghi rõ **người thực hiện** (`transaction.user_id`).

---

## 1. Mục đích & phạm vi

- **Hồ sơ cá nhân** (`/settings`): mọi người dùng tự sửa tên + đổi mật khẩu + đăng xuất.
- **Quản lý người dùng** (`/settings/users`): **owner** tạo/quản lý tài khoản member.

---

## 2. Routes & quyền

| Route | Thư mục | Quyền |
|-------|---------|-------|
| `/settings` | `src/app/(dashboard)/settings/page.tsx` | owner + member |
| `/settings/users` | `src/app/(dashboard)/settings/users/page.tsx` | **owner only** — server component check `role`, member → `redirect("/")` |

---

## 3. Hồ sơ cá nhân (`/settings`)

### 3.1. Thông tin
- Hiển thị: tên, email (chỉ đọc — **không đổi email**), role.

### 3.2. Sửa tên
- Form đổi `name` → Server Action `updateProfile` (Better Auth `updateUser`) → revalidate.

### 3.3. Đổi mật khẩu
- Form: mật khẩu hiện tại + mật khẩu mới + xác nhận. Ràng buộc: mới ≥ 8 ký tự, xác nhận khớp.
- Server Action gọi Better Auth `changePassword` (yêu cầu mật khẩu hiện tại đúng). Sai mật khẩu cũ → `AUTH_ERROR`.

### 3.4. Đăng xuất
- Nút **Đăng xuất** → Better Auth `signOut` → về `/login`.

---

## 4. Quản lý người dùng (`/settings/users`, owner only)

### 4.1. Danh sách member
- Cột: tên, email, role, **trạng thái** (Hoạt động / Đã khóa), **có giao dịch?** (để biết xóa được không).
- Owner tự thấy ở đầu danh sách; **các nút khóa/xóa/reset KHÔNG áp lên chính owner** (ẩn) — owner không tự khóa/xóa mình.

### 4.2. Tạo member
- Form: `name`, `email` (unique), `password` ban đầu (≥ 8) → tạo user `role = member`.
- Server Action dùng Better Auth (tạo user + gán role member). Email trùng → `CONFLICT`.

### 4.3. Reset mật khẩu member
- Owner đặt **mật khẩu mới** cho member (≥ 8) — không cần mật khẩu cũ (owner quyền admin).

### 4.4. Khóa / mở khóa member
- **Khóa** (`banUser`): vô hiệu hóa đăng nhập + **thu hồi session hiện có ngay** (nếu đang đăng nhập sẽ bị đẩy ra). Khóa **vĩnh viễn** tới khi mở (không đặt `banExpires`); `banReason` tùy chọn. **Giữ nguyên lịch sử** giao dịch. **Mở khóa** (`unbanUser`) để dùng lại.

### 4.5. Xóa member
- **Chỉ cho xóa khi member CHƯA phát sinh giao dịch nào** (không tồn tại `transaction.user_id = member.id`).
- Nếu **đã có giao dịch** → **chặn xóa** (để không mất dấu người thực hiện), gợi ý **khóa** thay thế.

---

## 5. Cơ chế kỹ thuật (dependency)

- Dùng **Better Auth admin plugin** cho quản lý người dùng: `createUser`, `setUserPassword`, `banUser`/`unbanUser` (khóa/mở khóa), `removeUser`.
  - Thêm plugin vào `src/lib/auth.ts` với `adminRoles: ["owner"]`; plugin bổ sung field `banned` / `banReason` / `banExpires` vào `user`.
  - → **Cập nhật** [auth-config.md](../auth-config.md) (thêm admin plugin) + `architecture.md` (user thêm field khóa).
- Mọi action ở `/settings/users` kiểm tra lại `role = owner` ở server (defense-in-depth ngoài chặn route).
- Xóa member: trước khi `removeUser`, query `transactions` theo `user_id`; có bản ghi → trả lỗi `CONFLICT`.

---

## 6. Acceptance criteria

- [ ] `/settings`: mọi role sửa được tên, đổi mật khẩu (đúng mật khẩu cũ mới cho đổi), đăng xuất.
- [ ] `/settings/users`: member bị server redirect `/`; chỉ owner vào được.
- [ ] Owner tạo member → user `role=member`; email trùng → `CONFLICT`.
- [ ] Owner reset mật khẩu member (không cần mật khẩu cũ).
- [ ] Khóa member → member không đăng nhập được; mở khóa → dùng lại; lịch sử giao dịch giữ nguyên.
- [ ] Xóa member chỉ thành công khi member chưa có giao dịch; đã có giao dịch → chặn + gợi ý khóa.

---

## 7. Điểm chưa chốt

1. **Giới hạn số owner**: hệ thống 1 owner (từ register). Có cho nâng member thành owner / nhiều owner không? → tạm **không** (1 owner duy nhất).
2. **Tự khóa/xóa chính mình**: owner không thao tác khóa/xóa lên chính mình (ẩn nút). Đã ngầm định.
