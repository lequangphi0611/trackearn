# Spec — Báo cáo (Reports)

> **Loại:** spec nghiệp vụ tổng hợp (read-only, owner).
> **Tham chiếu:** [business-overview.md](../business-overview.md), [transactions-and-debts.md](./transactions-and-debts.md), [expenses.md](./expenses.md), [devices.md](./devices.md), [repair-jobs.md](./repair-jobs.md).

---

## 1. Mục đích & phạm vi

Tổng hợp số liệu cho **chủ hộ (owner)** ra quyết định. Hai cấp:
- **Hàng ngày** (dashboard `/`): tình hình trong ngày.
- **Theo tháng** (`/reports`): so sánh & lãi/lỗ từng mảng — **owner only**.

Không phát sinh dữ liệu mới — chỉ đọc & tổng hợp từ `transactions`, `debts`, `devices`, `spare_parts`.

---

## 2. Báo cáo ngày (dashboard `/`)

| Thành phần | Nguồn / công thức |
|------------|-------------------|
| Tổng thu hôm nay | Σ `paid_amount` (hoặc `amount`?) income, `transacted_at` = hôm nay — **xem mục 6.1** |
| Tổng chi hôm nay | Σ expense hôm nay |
| Lãi hôm nay (tách mảng) | **chênh tiền nhanh** = thu − chi theo từng `business_line` trong ngày (KHÁC "lãi gộp tháng" ở mục 3.2 — xem ghi chú dưới) |
| Giao dịch trong ngày | list `transactions` hôm nay |
| Công nợ chưa thu | `debts` chưa `settled_at`, nhóm `direction` |
| Tồn kho thiết bị | `devices` `status=in_stock` |

> Member thấy bản rút gọn (không có tổng thu/chi/lãi) — xem [screens.md](./screens.md).
>
> **Phân biệt 2 loại "lãi":** "Lãi hôm nay" ở dashboard là **chênh thu−chi nhanh** trong ngày (xem nhanh dòng tiền). "Lãi gộp" ở báo cáo tháng (mục 3.2) là **lãi kế toán** (trừ giá vốn, sell−buy…). Hai con số khác nhau về bản chất, không mâu thuẫn.

---

## 3. Báo cáo tháng (`/reports`, owner only)

### 3.1. So sánh doanh thu
- Doanh thu tháng này vs tháng trước (Σ income theo tháng), kèm % thay đổi.

### 3.2. Lãi gộp từng mảng
Cho mỗi `business_line` (xe_muc / thiet_bi / phu_kien). **"Chi phí mảng"** = các expense có `business_line_id` = mảng đó (không gồm `cost_of_goods` đã trừ riêng dưới dạng giá vốn, và không gồm chi phí chung NULL):

| Mảng | Lãi gộp ≈ |
|------|-----------|
| Xe múc | Σ income job − giá vốn phụ tùng xuất − chi phí mảng |
| Thiết bị | Σ(sell − buy) máy bán + thu sửa/phụ kiện − chi phí mảng |
| Phụ kiện | Σ income − Σ chi phí nhập − chi phí mảng |

### 3.3. Chi phí theo danh mục
- `GROUP BY category_id` trên expense trong tháng → Σ `amount`, sắp xếp giảm dần (khoản tốn nhất trước). Xem [expenses.md](./expenses.md).

### 3.4. Chi phí chung
- Expense `business_line_id = NULL` gộp riêng mục **"Chi phí chung"**, không phân bổ vào mảng.

---

## 4. Phân quyền

- `/reports`: **owner only** — chặn ở server component (xem [middleware.md](./middleware.md) mục 5).
- Dashboard: owner đầy đủ; member rút gọn.

---

## 5. Phụ thuộc

1. Toàn bộ spec nghiệp vụ (transactions, expenses, devices, repair-jobs, accessories) — nguồn số liệu.
2. Màn `/` và `/reports` ([screens.md](./screens.md)).

---

## 6. Điểm chưa chốt

1. **"Doanh thu/lãi" tính theo tiền mặt thực thu (`paid_amount`) hay theo ghi nhận (`amount`)?**
   - *Cash-basis* (paid_amount): khớp tiền thực có, nhưng trả sau chưa tính.
   - *Accrual* (amount): phản ánh đủ giao dịch kể cả nợ.
   - → **Đề xuất**: báo cáo theo `amount` (accrual) cho lãi/lỗ, kèm chỉ số "thực thu" riêng. Cần chốt.
2. **Mốc "hôm nay"/"tháng"** theo timezone nào → đề xuất giờ VN (Asia/Ho_Chi_Minh).
3. **Phân bổ chi phí chung vào mảng**: hiện tách riêng, không phân bổ (xem [expenses.md](./expenses.md) mục 8).
