# Spec màn hình — Dashboard / Tổng quan (`/`)

> **Loại:** spec chi tiết 1 màn hình, đầu bài cho AI/dev implement.
> **Tham chiếu:** [../screens.md](../screens.md), [reports.md](../reports.md) (nội dung báo cáo ngày — mục 2), [transactions-and-debts.md](../transactions-and-debts.md), [devices.md](../devices.md), [middleware.md](../middleware.md), [coding-rules](../../coding-rules.md).
> **Quyết định nền:** báo cáo **accrual** (theo `amount`) kèm chỉ số "thực thu" (`paid_amount`); timezone **`Asia/Ho_Chi_Minh`**; member xem **bản rút gọn**.

---

## 1. Mục đích & phạm vi

Trang chủ sau đăng nhập (`/`). Cho chủ hộ **xem nhanh tình hình trong ngày** và **nhập giao dịch nhanh**. Là màn dùng nhiều nhất → tối ưu cho mobile.

Hai biến thể theo role:
- **owner**: bản đầy đủ (tổng thu/chi/lãi, giao dịch, công nợ, tồn kho).
- **member**: bản rút gọn (chỉ nhập nhanh + giao dịch của mình).

---

## 2. Route & quyền truy cập

| Thuộc tính | Giá trị |
|------------|---------|
| Route | `/` (nhận query `?date=YYYY-MM-DD`, mặc định hôm nay) |
| Thư mục | `src/app/(dashboard)/page.tsx` |
| Quyền | owner + member (đã đăng nhập; middleware chặn nếu chưa) |
| Biến thể | Render theo `session.user.role` ở server component |

> **Client islands:** trang là Server Component; chỉ **date picker** (mục 3) và **form nhập nhanh** (mục 4.1) là client component nhỏ. Phần hiển thị số liệu/danh sách render server.
> **Empty state:** ngày không có giao dịch → hiển thị thông báo rỗng thân thiện, không lỗi.

---

## 3. Phạm vi dữ liệu (chọn ngày)

- Mặc định hiển thị **hôm nay** theo `Asia/Ho_Chi_Minh`.
- Có **bộ chọn ngày** (date picker) cho xem ngày khác → cập nhật query `?date=`. Dùng **URL state** (server re-fetch theo `date`), không phải client state.
- Các mốc "trong ngày" tính theo ranh giới ngày giờ VN của `date` đã chọn.

---

## 4. Bố cục & nội dung — bản owner

Thứ tự ưu tiên trên mobile (trên xuống):

### 4.1. Nhập nhanh (đầu trang)
- **1 nút "Nhập giao dịch"** → mở form nhập nhanh. Trong form chọn **mảng** (Xe múc / Thiết bị / Phụ kiện / **Chi phí chung**) + loại thu/chi + số tiền + trạng thái thanh toán.
- **Bán máy ngay từ form này:** khi chọn mảng **Thiết bị** + loại **Thu**, form hiện thêm ô tùy chọn **"Gắn với máy trong kho"** (chọn 1 device `in_stock`).
  - **Chọn máy** → giao dịch trở thành **bán máy**: `amount` = giá bán, set `device.status = sold` + income `source_kind = device_sell` (giống dialog "Bán ra" ở [devices.md](./devices.md)).
  - **Để trống** → thu lẻ mảng thiết bị (sửa chữa nhỏ / phụ kiện lẻ), không gắn máy.
- Form quick-entry tái sử dụng logic Server Action của giao dịch (xem [transactions.md](./transactions.md), [transactions-and-debts.md](../transactions-and-debts.md)); sau khi lưu → revalidate dashboard.

### 4.2. Tổng thu — chi — lãi trong ngày (tách mảng)
- Mỗi mảng (`xe_muc`/`thiet_bi`/`phu_kien`) + dòng **Chi phí chung**: **Thu** = Σ `amount` income; **Chi** = Σ `amount` expense; **Lãi nhanh** = Thu − Chi (chênh tiền nhanh, KHÁC lãi gộp tháng — xem [reports.md](../reports.md)).
- Kèm dòng **tổng cộng** + chỉ số **"thực thu"** (Σ `paid_amount`) hiển thị riêng.

### 4.3. Giao dịch trong ngày
- Danh sách `transactions` có `transacted_at` thuộc ngày đã chọn: giờ, mảng, loại, số tiền, trạng thái thanh toán, người nhập.

### 4.4. Công nợ chưa tất toán (danh sách đầy đủ)
- Toàn bộ `debts` chưa `settled_at`, nhóm theo `direction` (receivable = khách nợ / payable = mình nợ): tên đối tác, còn lại (`total − paid`), ngày hẹn, **đánh dấu quá hạn** (`due_date <` **ngày hiện tại thực** — không phải `date` đã chọn).
- Không cắt ngắn — hiển thị đầy đủ (có thể cuộn).

### 4.5. Tồn kho thiết bị (danh sách đầy đủ)
- `devices` `status = in_stock`: tên máy, giá mua, ngày mua; **tổng vốn tồn** = Σ `buy_price`.

> Lưu ý: công nợ & tồn kho **không lọc theo ngày** (là trạng thái hiện tại), khác với block thu/chi/giao dịch (theo `date`).

---

## 5. Bản rút gọn — member

Chỉ gồm:
1. **Nhập nhanh** (giống 4.1).
2. **Giao dịch của mình trong ngày đã chọn**: `transactions` có `user_id = session.user.id` và `transacted_at` thuộc ngày đã chọn.

**Không** hiển thị: tổng thu/chi/lãi, công nợ toàn cửa hàng, tồn kho. (Phù hợp "member không xem báo cáo tổng hợp".)

---

## 6. Dữ liệu & nguồn (queries)

Server Component fetch trực tiếp qua Drizzle (`src/queries/`):

| Query | Dùng cho |
|-------|----------|
| `getDailySummary(date)` | 4.2 — thu/chi/lãi/thực thu theo mảng |
| `getTransactionsByDate(date)` | 4.3 |
| `getOpenDebts()` | 4.4 |
| `getDeviceStock()` | 4.5 |
| `getMyTransactionsByDate(date, userId)` | 5.2 (member) |

- Owner gọi 4.2–4.5; member chỉ gọi `getMyTransactionsByDate`. Quyết định gọi query nào dựa trên `role` (tránh fetch thừa cho member).

---

## 7. Tương tác & điều hướng

- Đổi ngày ở date picker → đổi `?date=` → server re-fetch.
- Bấm một giao dịch → `/transactions/<mảng>/[id]`.
- Block công nợ có link sang `/debts`; tồn kho link sang `/devices` (để thao tác chi tiết).
- Lưu giao dịch ở form nhập nhanh → revalidate `/`.

---

## 8. Phân quyền

- Cả hai role vào được `/`. Server component **phân nhánh theo `role`**: member không bao giờ nhận dữ liệu tổng hợp (không fetch các query owner).
- Không cần chặn ở middleware (chỉ cần đã đăng nhập).

---

## 9. Acceptance criteria

- [ ] Owner mở `/` thấy: nút nhập nhanh, thu/chi/lãi theo mảng (+ chi phí chung, + thực thu), giao dịch trong ngày, công nợ đầy đủ, tồn kho đầy đủ.
- [ ] Member mở `/` chỉ thấy nút nhập nhanh + giao dịch của chính mình; không có số tổng/công nợ/tồn kho.
- [ ] Đổi ngày → toàn bộ block theo-ngày cập nhật; công nợ & tồn kho giữ nguyên (trạng thái hiện tại).
- [ ] "Lãi nhanh" = Thu − Chi theo `amount`; có chỉ số thực thu theo `paid_amount`.
- [ ] Mốc ngày tính theo `Asia/Ho_Chi_Minh`.
- [ ] Nhập nhanh lưu xong → dashboard tự cập nhật (revalidate).
- [ ] Công nợ quá hạn được đánh dấu rõ.

---

## 10. Điểm chưa chốt

1. **Cơ chế form nhập nhanh**: dialog/modal ngay trên dashboard hay điều hướng tới route nhập nhanh riêng? → đề xuất **dialog** (ít rời trang, nhanh trên mobile).
2. **Mảng mặc định** khi mở form nhập nhanh: nhớ mảng dùng gần nhất hay luôn để trống bắt chọn? → đề xuất **để trống, bắt chọn** (tránh nhập nhầm mảng).
