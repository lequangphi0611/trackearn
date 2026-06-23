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
| `/register` | Đăng ký | Tạo tài khoản đầu tiên (owner). Member do owner tạo trong Settings → ẩn route này sau khi đã có owner. | Public / hạn chế |

---

## 2. Dashboard ngày — `src/app/(dashboard)/`

| Route | Màn hình | Chức năng tóm tắt | Quyền |
|-------|----------|-------------------|-------|
| `/` | Tổng quan ngày | Tổng thu — tổng chi — lãi trong ngày (tách theo 3 mảng); danh sách giao dịch hôm nay; công nợ chưa thu; tồn kho thiết bị chưa bán. Lối tắt nhập giao dịch nhanh (ưu tiên mobile). | owner: đầy đủ · member: bản rút gọn (chỉ lối tắt nhập liệu + giao dịch của mình) ⚠️ |

---

## 3. Giao dịch — `src/app/(dashboard)/transactions/`

| Route | Màn hình | Chức năng tóm tắt | Quyền |
|-------|----------|-------------------|-------|
| `/transactions` | Danh sách giao dịch | Liệt kê thu/chi, lọc theo mảng / ngày / trạng thái thanh toán (paid · partial · pending). | owner + member |
| `/transactions/new` | Nhập giao dịch nhanh | Chọn loại (income/expense), mảng, số tiền, đã thu/trả hay trả sau → nếu trả sau sinh **công nợ**. Tối ưu nhập nhanh trên điện thoại. | owner + member |
| `/transactions/[id]` | Chi tiết / sửa giao dịch | Xem, sửa, xoá một giao dịch; xem công nợ liên kết (nếu có). | owner + member |

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
| `/debts/[id]` | Chi tiết công nợ | Xem giao dịch gốc; **ghi nhận trả nợ** (cập nhật `paid`, `settled_at` khi trả đủ). | owner + member |

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
| Auth | ✅ | ✅ |
| Dashboard | ✅ đầy đủ | ⚠️ rút gọn |
| Transactions (list/new/detail) | ✅ | ✅ |
| Devices / Spare-parts / Repair-jobs | ✅ | ✅ |
| Debts | ✅ | ✅ |
| Reports | ✅ | ❌ |
| Settings → profile | ✅ | ✅ |
| Settings → users | ✅ | ❌ |

> Middleware Better Auth chặn route theo role. `member` bị redirect khỏi `/reports` và `/settings/users`.

---

## Yêu cầu xuyên suốt (mọi màn hình)

- **PWA / mobile-first**: layout responsive, thêm vào Home Screen; nhập liệu nhanh là ưu tiên UX số 1.
- **Đọc**: Server Component fetch trực tiếp DB qua Drizzle (query trong `src/queries/`).
- **Ghi**: Server Action trả về `ActionResult<T>`, validate bằng Zod, revalidate cache.
- Tham chiếu data model trong [architecture.md](../architecture.md).

---

## ⚠️ Điểm cần chốt (default đang dùng — chỉnh nếu cần)

1. **Dashboard cho member**: hiện giả định member thấy bản rút gọn (chỉ lối tắt nhập + giao dịch của mình), không thấy tổng thu/chi/lãi. → Member có được xem dashboard tổng không?
2. **3 mảng dùng chung `transactions`** + bộ lọc, thay vì 3 màn hình riêng. → Có muốn tách màn hình riêng cho từng mảng không?
3. **`/register`**: mở công khai để tạo owner lần đầu rồi khoá, hay seed owner sẵn và bỏ hẳn route đăng ký?
4. **Repair-jobs** chưa có trong cấu trúc thư mục ở `architecture.md` (chỉ có trong data model) — đã bổ sung route `/repair-jobs`. → Đồng ý thêm nhóm màn hình này chứ?
