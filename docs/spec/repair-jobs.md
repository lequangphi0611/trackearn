# Spec — Sửa xe múc: Kho phụ tùng & Job (Repair Jobs)

> **Loại:** spec nghiệp vụ mảng **xe múc** (`xe_muc`).
> **Tham chiếu:** [business-overview.md](../business-overview.md), [architecture.md](../architecture.md), [transactions-and-debts.md](./transactions-and-debts.md), [expenses.md](./expenses.md).

---

## 1. Mục đích & phạm vi

Quản lý mảng sửa xe múc: **kho phụ tùng** (nhập về, xuất khi sửa) và **job sửa** (mỗi lần sửa cho một khách: phụ tùng xuất + tiền công). Mỗi job sinh ra 1 giao dịch thu (income).

---

## 2. Mô hình dữ liệu

### 2.1. `spare_parts` (kho phụ tùng)

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | pk | |
| `name` | text | |
| `unit` | text | Đơn vị (cái, bộ, lít…) |
| `quantity` | numeric | Tồn kho hiện tại |
| `buy_price` | numeric | Giá vốn / đơn vị (lần nhập gần nhất) |

### 2.2. `repair_jobs` (job sửa)

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | pk | |
| `customer_name` | text | |
| `labor_fee` | numeric | Tiền công |
| `note` | text | |
| `job_date` | date | |
| `transaction_id` | fk → transactions | Giao dịch income sinh ra từ job |

### 2.3. `repair_job_parts` (phụ tùng xuất cho job)

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | pk | |
| `job_id` | fk → repair_jobs | |
| `spare_part_id` | fk → spare_parts | |
| `quantity` | numeric | Số lượng xuất |
| `unit_price` | numeric | **Giá bán** phụ tùng cho khách (có thể khác buy_price) |

---

## 3. Quy tắc nghiệp vụ

### 3.1. Nhập phụ tùng vào kho
- Tạo/cộng `spare_parts.quantity`, cập nhật `buy_price`.
- **Sinh 1 transaction expense** (`category = cost_of_goods`, `business_line = xe_muc`) — xem [expenses.md](./expenses.md).

### 3.2. Tạo job
- Chọn khách, thêm các dòng phụ tùng (chọn từ kho, số lượng, `unit_price`), nhập `labor_fee`.
- **Trừ tồn**: mỗi dòng giảm `spare_parts.quantity` tương ứng.
- **Tổng tiền job** = Σ(`quantity` × `unit_price`) + `labor_fee`.
- **Sinh 1 transaction income** (`business_line = xe_muc`, `amount` = tổng job, `paid_amount` theo thực thu) → trả sau thì sinh công nợ (xem [transactions-and-debts.md](./transactions-and-debts.md)). Gắn `transaction_id` vào job.

### 3.3. Lãi gộp một job
`lãi = tổng job income − Σ(quantity × spare_part.buy_price) − (chi phí khác nếu có)`
Tức tiền công + chênh lệch giá bán/giá vốn phụ tùng.

---

## 4. Nhập liệu

- **Kho phụ tùng**: `/spare-parts` (danh sách, nhập mới, **kiểm kê/sửa tồn thủ công**). Lưu ý: nhập hàng (mục 3.1) sinh expense; còn **chỉnh tồn thủ công khi kiểm kê** (lệch đếm) **không** sinh transaction.
- **Job**: `/repair-jobs` (danh sách), `/repair-jobs/new` (tạo job + xuất phụ tùng), `/repair-jobs/[id]` (chi tiết/sửa). Xem [screens.md](./screens.md).

---

## 5. Báo cáo liên quan

- **Tồn kho phụ tùng**: list `spare_parts` còn `quantity > 0`.
- Lãi gộp mảng xe múc: tổng income job − giá vốn phụ tùng xuất − chi phí mảng (xem [reports.md](./reports.md)).

---

## 6. Phụ thuộc

1. [transactions-and-debts.md](./transactions-and-debts.md) — job sinh income, trả sau → công nợ.
2. [expenses.md](./expenses.md) — nhập phụ tùng sinh expense `cost_of_goods`.
3. Màn `/spare-parts`, `/repair-jobs` ([screens.md](./screens.md)).

---

## 7. Acceptance criteria

- [ ] Nhập phụ tùng → tăng tồn + sinh expense `cost_of_goods` / `xe_muc`.
- [ ] Tạo job xuất 2 phụ tùng + tiền công → tồn giảm đúng, sinh 1 income = Σ phụ tùng + công.
- [ ] Job trả sau → sinh công nợ `receivable` đúng số còn lại.
- [ ] Lãi job = tiền công + (giá bán − giá vốn) phụ tùng.
- [ ] Sửa/xoá job → hoàn tồn kho và điều chỉnh giao dịch tương ứng **theo cơ chế chốt ở mục 8.2** (acceptance này phụ thuộc quyết định đó).

---

## 8. Điểm chưa chốt

1. **Xuất quá tồn**: khi job cần nhiều hơn tồn → chặn, hay cho âm kho (nhập bù sau)? → đề xuất **cảnh báo nhưng vẫn cho** (thực tế thợ hay xuất trước).
2. **Sửa/xoá job** đã trừ kho: cần hoàn (`+quantity`) lại tồn và sửa/huỷ transaction liên quan — chốt cơ chế hoàn kho.
3. **buy_price khi nhập nhiều lần giá khác nhau**: dùng giá gần nhất (đơn giản) hay bình quân gia quyền? → tạm **giá gần nhất**.
