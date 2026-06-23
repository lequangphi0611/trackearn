# Spec màn hình — TrackEarn

> **Mục đích tài liệu:** đầu bài (brief) cho AI/dev implement. Liệt kê **toàn bộ màn hình** của app và chức năng tương ứng ở mức **tóm tắt**.
>
> Nguồn: [business-overview.md](../business-overview.md), [architecture.md](../architecture.md). Tuân theo [coding-rules.md](../coding-rules.md) khi implement.

## Quy ước

- **Route**: đường dẫn App Router (Next.js 15). `[id]` = dynamic segment.
- **Quyền**: `owner` (chủ hộ, xem mọi báo cáo) / `member` (người thân, chỉ nhập liệu, không xem báo cáo tổng hợp).
- **3 mảng**: `xe_muc` (sửa xe múc) / `thiet_bi` (thiết bị điện tử) / `phu_kien` (phụ kiện).

---

## 1. Auth — `src/app/(auth)/`

| Route | Màn hình | Chức năng tóm tắt | Quyền |
|-------|----------|-------------------|-------|
| `/login` | Đăng nhập | Email + mật khẩu, tạo session (Better Auth). | Public |
| `/register` | Đăng ký | Tạo tài khoản đầu tiên (owner). Sau khi đã có owner thì **khoá** route (logic: kiểm tra DB có user role=owner chưa). Member do owner tạo trong Settings. | Public (đến khi có owner) |

---

## 2. Dashboard ngày — `src/app/(dashboard)/`

| Route | Màn hình | Chức năng tóm tắt | Quyền |
|-------|----------|-------------------|-------|
| `/` | Tổng quan ngày | Tổng thu — tổng chi — lãi trong ngày (tách theo 3 mảng); danh sách giao dịch hôm nay; công nợ chưa thu; tồn kho thiết bị chưa bán. Lối tắt nhập giao dịch nhanh (ưu tiên mobile). | owner: đầy đủ · member: bản rút gọn (chỉ lối tắt nhập liệu + giao dịch của mình) ⚠️ |

---

## 3. Giao dịch theo mảng — `src/app/(dashboard)/transactions/`

Mỗi mảng có **màn hình giao dịch riêng**. Mỗi màn gồm 3 route con: danh sách (`/...`), nhập nhanh (`/.../new`), chi tiết-sửa (`/.../[id]`). Nhập liệu tối ưu cho mobile. Khi chọn "trả sau" → sinh **công nợ**; trạng thái thanh toán: paid · partial · pending.

| Route (gốc + `/new` + `/[id]`) | Màn hình | Chức năng tóm tắt | Quyền |
|-------|----------|-------------------|-------|
| `/transactions/xe-muc` | Giao dịch — Xe múc | Thu/chi mảng sửa xe múc. Income chủ yếu sinh từ **repair-jobs**; ngoài ra ghi chi phí mảng (vd nhập phụ tùng) và giao dịch thủ công. | owner + member |
| `/transactions/thiet-bi` | Giao dịch — Thiết bị | Thu/chi mảng thiết bị điện tử. Income từ **bán devices** + sửa chữa nhỏ + phụ kiện lẻ; expense từ **mua devices**. | owner + member |
| `/transactions/phu-kien` | Giao dịch — Phụ kiện | Bán lẻ phụ kiện (ốp, cáp, pin...) — thu/chi đơn giản, có thể trả ngay hoặc trả sau. | owner + member |

---

## 4. Kho thiết bị điện tử — `src/app/(dashboard)/devices/`

| Route | Màn hình | Chức năng tóm tắt | Quyền |
|-------|----------|-------------------|-------|
| `/devices` | Kho thiết bị | Danh sách máy, lọc theo trạng thái (in_stock · sold); hiển thị giá mua / giá bán / lãi. | owner + member |
| `/devices/new` | Nhập máy mua vào | Tên máy, giá mua, ngày mua, nơi mua, tình trạng/ghi chú → sinh transaction (expense). | owner + member |
| `/devices/[id]` | Chi tiết thiết bị | Xem/sửa; thao tác **bán ra** (giá bán, ngày bán, đã thu/trả sau) → sinh transaction (income) + công nợ nếu trả sau. | owner + member |

---

## 5. Kho phụ tùng xe múc — `src/app/(dashboard)/spare-parts/`

| Route | Màn hình | Chức năng tóm tắt | Quyền |
|-------|----------|-------------------|-------|
| `/spare-parts` | Danh sách phụ tùng | Tồn kho phụ tùng: tên, đơn vị, số lượng, giá nhập. | owner + member |
| `/spare-parts/new` | Nhập phụ tùng | Thêm phụ tùng vào kho (nhập về). | owner + member |
| `/spare-parts/[id]` | Chi tiết phụ tùng | Xem/sửa thông tin, điều chỉnh tồn kho. | owner + member |

---

## 6. Sửa xe múc (job) — `src/app/(dashboard)/repair-jobs/`

| Route | Màn hình | Chức năng tóm tắt | Quyền |
|-------|----------|-------------------|-------|
| `/repair-jobs` | Danh sách job | Các lần sửa: khách, ngày, tiền công, trạng thái thanh toán. | owner + member |
| `/repair-jobs/new` | Tạo job sửa xe | Tên khách, chọn phụ tùng xuất kho (tên/số lượng/giá → trừ tồn `spare_parts`), tiền công, đã thu/trả sau → sinh transaction (income) + công nợ nếu trả sau. | owner + member |
| `/repair-jobs/[id]` | Chi tiết job | Xem/sửa danh sách phụ tùng đã xuất, tiền công, công nợ liên kết. | owner + member |

---

## 7. Công nợ — `src/app/(dashboard)/debts/`

| Route | Màn hình | Chức năng tóm tắt | Quyền |
|-------|----------|-------------------|-------|
| `/debts` | Danh sách công nợ | Ai nợ, tổng nợ, đã trả, còn lại, ngày hẹn trả; lọc chưa thu / quá hạn. Áp dụng cho **cả 3 mảng**. | owner + member |
| `/debts/[id]` | Chi tiết công nợ | Xem giao dịch gốc; **ghi nhận trả nợ** (cộng dồn `paid`). Trả một phần → trạng thái `partial`; trả đủ → set `settled_at` và trạng thái `paid`. | owner + member |

---

## 8. Báo cáo tháng — `src/app/(dashboard)/reports/`

| Route | Màn hình | Chức năng tóm tắt | Quyền |
|-------|----------|-------------------|-------|
| `/reports` | Báo cáo tháng | So sánh doanh thu tháng này vs tháng trước; lãi gộp từng mảng; chi phí phân theo danh mục (khoản nào tốn nhất). | **owner only** |

---

## 9. Cài đặt — `src/app/(dashboard)/settings/`

| Route | Màn hình | Chức năng tóm tắt | Quyền |
|-------|----------|-------------------|-------|
| `/settings` | Hồ sơ cá nhân | Xem thông tin, đổi mật khẩu. | owner + member |
| `/settings/users` | Quản lý người dùng | Owner tạo/sửa/khoá tài khoản member, gán role. | **owner only** |

---

## Ma trận phân quyền (tóm tắt)

| Nhóm màn hình | owner | member |
|---------------|:-----:|:------:|
| Auth (login/register) | công khai — chưa cần session | công khai |
| Dashboard | ✅ đầy đủ | ⚠️ rút gọn |
| Transactions theo mảng (xe-muc/thiet-bi/phu-kien) | ✅ | ✅ |
| Devices / Spare-parts / Repair-jobs | ✅ | ✅ |
| Debts | ✅ | ✅ |
| Reports | ✅ | ❌ |
| Settings → profile | ✅ | ✅ |
| Settings → users | ✅ | ❌ |

> Middleware Better Auth chặn route theo role. `member` bị redirect khỏi `/reports` và `/settings/users`.
>
> **Phân quyền dữ liệu (member):**
> - "Giao dịch của mình" = giao dịch có `user_id` = member đang đăng nhập (người tạo).
> - Member **được** nhập liệu và xem dữ liệu vận hành (danh sách giao dịch, kho, công nợ) để làm việc, nhưng **không xem báo cáo tổng hợp** (`/reports`) và không thấy block tổng thu/chi/lãi ở dashboard.

---

## Yêu cầu xuyên suốt (mọi màn hình)

- **PWA / mobile-first**: layout responsive, thêm vào Home Screen; nhập liệu nhanh là ưu tiên UX số 1.
- **Đọc**: Server Component fetch trực tiếp DB qua Drizzle (query trong `src/queries/`).
- **Ghi**: Server Action trả về `ActionResult<T>`, validate bằng Zod, revalidate cache.
- Tham chiếu data model trong [architecture.md](../architecture.md).

---

## Quyết định đã chốt

1. **Dashboard cho member**: bản **rút gọn** — chỉ lối tắt nhập liệu + giao dịch của mình, không thấy tổng thu/chi/lãi.
2. **3 mảng**: mỗi mảng có **màn hình giao dịch riêng** (`/transactions/xe-muc`, `/thiet-bi`, `/phu-kien`), không dùng chung 1 màn + bộ lọc.
3. **`/register`**: **mở công khai** để tạo owner lần đầu, sau khi có owner thì **khoá**; member do owner tạo trong Settings.
4. **`/repair-jobs`**: giữ làm nhóm màn hình riêng; đã đồng bộ vào cấu trúc thư mục trong `architecture.md`.
